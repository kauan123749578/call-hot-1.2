const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const next = require('next');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const server = http.createServer(app);

// WebSocket Server para signaling
const wss = new WebSocket.Server({ server, path: '/ws' });

// Armazena as salas de call
const calls = new Map();

// Armazena as automações
const automations = new Map();

// Armazena bots do Telegram (userId -> bot instance)
const telegramBots = new Map();

// Persistência simples em arquivo
const dataDir = path.join(__dirname, 'data');
const callsFile = path.join(dataDir, 'calls.json');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const eventsFile = path.join(dataDir, 'events.json');
const salesFile = path.join(dataDir, 'sales.json');
const automationsFile = path.join(dataDir, 'automations.json');
const telegramBotsFile = path.join(dataDir, 'telegram-bots.json');
const conversationsFile = path.join(dataDir, 'conversations.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(callsFile)) fs.writeFileSync(callsFile, JSON.stringify({ calls: [] }, null, 2));
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
  if (!fs.existsSync(sessionsFile)) fs.writeFileSync(sessionsFile, JSON.stringify({ sessions: [] }, null, 2));
  if (!fs.existsSync(eventsFile)) fs.writeFileSync(eventsFile, JSON.stringify({ events: [] }, null, 2));
  if (!fs.existsSync(salesFile)) fs.writeFileSync(salesFile, JSON.stringify({ sales: [] }, null, 2));
  if (!fs.existsSync(automationsFile)) fs.writeFileSync(automationsFile, JSON.stringify({ automations: [] }, null, 2));
  if (!fs.existsSync(telegramBotsFile)) fs.writeFileSync(telegramBotsFile, JSON.stringify({ bots: [] }, null, 2));
  if (!fs.existsSync(conversationsFile)) fs.writeFileSync(conversationsFile, JSON.stringify({ conversations: [] }, null, 2));
}

function readJson(filePath, fallback) {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function appendEvent(evt) {
  const store = readJson(eventsFile, { events: [] });
  store.events = Array.isArray(store.events) ? store.events : [];
  store.events.push(evt);
  writeJson(eventsFile, store);
}

function listEvents(limit = 5000) {
  const store = readJson(eventsFile, { events: [] });
  const arr = Array.isArray(store.events) ? store.events : [];
  return arr.slice(Math.max(0, arr.length - limit));
}

function listSales() {
  const store = readJson(salesFile, { sales: [] });
  return Array.isArray(store.sales) ? store.sales : [];
}

function saveSales(sales) {
  writeJson(salesFile, { sales });
}

// Sistema de Conversas e Chat
const conversations = new Map(); // callId -> { callId, callerName, messages: [], active: true, createdAt, updatedAt }

function loadConversationsFromDisk() {
  try {
    ensureDataDir();
    if (!fs.existsSync(conversationsFile)) return;
    const raw = fs.readFileSync(conversationsFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.conversations) ? parsed.conversations : [];
    items.forEach((conv) => {
      if (!conv?.callId) return;
      conversations.set(conv.callId, {
        callId: conv.callId,
        callerName: conv.callerName || null,
        messages: Array.isArray(conv.messages) ? conv.messages : [],
        active: conv.active !== false,
        createdAt: conv.createdAt || new Date().toISOString(),
        updatedAt: conv.updatedAt || new Date().toISOString(),
        ownerUserId: conv.ownerUserId || null
      });
    });
  } catch (e) {
    console.error('Erro ao carregar conversas:', e);
  }
}

function persistConversations() {
  try {
    ensureDataDir();
    const out = [];
    for (const [callId, conv] of conversations.entries()) {
      out.push({
        callId: conv.callId,
        callerName: conv.callerName || null,
        messages: conv.messages || [],
        active: conv.active !== false,
        createdAt: conv.createdAt || new Date().toISOString(),
        updatedAt: conv.updatedAt || new Date().toISOString(),
        ownerUserId: conv.ownerUserId || null
      });
    }
    out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    writeJson(conversationsFile, { conversations: out });
  } catch (e) {
    console.error('Erro ao persistir conversas:', e);
  }
}

function getOrCreateConversation(callId, callerName, ownerUserId) {
  if (!conversations.has(callId)) {
    conversations.set(callId, {
      callId,
      callerName: callerName || null,
      messages: [],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerUserId: ownerUserId || null
    });
    persistConversations();
  }
  return conversations.get(callId);
}

function addMessageToConversation(callId, text, fromUser = false, ownerUserId = null) {
  const conv = conversations.get(callId);
  if (!conv) return null;
  
  const message = {
    id: uuidv4(),
    text,
    fromUser,
    timestamp: new Date().toISOString()
  };
  
  conv.messages.push(message);
  conv.updatedAt = new Date().toISOString();
  conversations.set(callId, conv);
  persistConversations();
  
  return message;
}

function parseCurrencyToNumber(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  const raw = input.replace(/\s/g, '').replace(/^R\$/i, '');
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let normalized = raw;
  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(',');
    const lastDot = raw.lastIndexOf('.');
    if (lastComma > lastDot) normalized = raw.replace(/\./g, '').replace(',', '.');
    else normalized = raw.replace(/,/g, '');
  } else if (hasComma) normalized = raw.replace(/\./g, '').replace(',', '.');
  else if (hasDot) {
    const lastDot = raw.lastIndexOf('.');
    const decimals = raw.length - lastDot - 1;
    if (decimals === 2) normalized = raw.replace(/,/g, '');
    else normalized = raw.replace(/\./g, '');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function addSale({ callId, amount, note, userId }) {
  const sales = listSales();
  const item = { id: uuidv4(), callId, amount, note: note || null, at: new Date().toISOString(), userId: userId || null };
  sales.push(item);
  saveSales(sales);
  appendEvent({ id: uuidv4(), type: 'sale_marked', callId, at: item.at, amount: item.amount, userId: userId || null });
  return item;
}

function serializeCalls() {
  const out = [];
  for (const [callId, call] of calls.entries()) {
    out.push({
      callId,
      title: call.title || null,
      videoUrl: call.videoUrl,
      callerName: call.callerName || null,
      callerAvatarUrl: call.callerAvatarUrl || null,
      expiresAt: call.expiresAt ? new Date(call.expiresAt).toISOString() : null,
      expectedAmount: typeof call.expectedAmount === 'number' ? call.expectedAmount : null,
      ownerUserId: call.ownerUserId || null,
      automationId: call.automationId || null,
      createdAt: call.createdAt ? new Date(call.createdAt).toISOString() : new Date().toISOString()
    });
  }
  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out;
}

function persistCalls() {
  try {
    ensureDataDir();
    fs.writeFileSync(callsFile, JSON.stringify({ calls: serializeCalls() }, null, 2));
  } catch (e) {
    console.error('Erro ao persistir calls:', e);
  }
}

function loadCallsFromDisk() {
  try {
    ensureDataDir();
    if (!fs.existsSync(callsFile)) return;
    const raw = fs.readFileSync(callsFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.calls) ? parsed.calls : [];
    items.forEach((item) => {
      if (!item?.callId || !item?.videoUrl) return;
      calls.set(item.callId, {
        title: item.title || null,
        videoUrl: item.videoUrl,
        callerName: item.callerName || null,
        callerAvatarUrl: item.callerAvatarUrl || null,
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
        expectedAmount: typeof item.expectedAmount === 'number' ? item.expectedAmount : null,
        ownerUserId: item.ownerUserId || null,
        automationId: item.automationId || null,
        hostId: null,
        guests: new Set(),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
      });
    });
  } catch (e) {
    console.error('Erro ao carregar calls do disco:', e);
  }
}

// --- AUTOMAÇÕES ---
function generateSecret() {
  return crypto.randomBytes(24).toString('hex');
}

function serializeAutomations() {
  const out = [];
  for (const [automationId, automation] of automations.entries()) {
    out.push({
      automationId,
      name: automation.name,
      title: automation.title || null,
      videoUrl: automation.videoUrl,
      callerName: automation.callerName || null,
      callerAvatarUrl: automation.callerAvatarUrl || null,
      expectedAmount: typeof automation.expectedAmount === 'number' ? automation.expectedAmount : null,
      ownerUserId: automation.ownerUserId || null,
      secret: automation.secret,
      isActive: automation.isActive !== false,
      createdAt: automation.createdAt ? new Date(automation.createdAt).toISOString() : new Date().toISOString()
    });
  }
  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out;
}

function persistAutomations() {
  try {
    ensureDataDir();
    fs.writeFileSync(automationsFile, JSON.stringify({ automations: serializeAutomations() }, null, 2));
  } catch (e) {
    console.error('Erro ao persistir automações:', e);
  }
}

function loadAutomationsFromDisk() {
  try {
    ensureDataDir();
    if (!fs.existsSync(automationsFile)) return;
    const raw = fs.readFileSync(automationsFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.automations) ? parsed.automations : [];
    items.forEach((item) => {
      if (!item?.automationId || !item?.secret) return;
      automations.set(item.automationId, {
        name: item.name || 'Sem nome',
        title: item.title || null,
        videoUrl: item.videoUrl || null,
        callerName: item.callerName || null,
        callerAvatarUrl: item.callerAvatarUrl || null,
        expectedAmount: typeof item.expectedAmount === 'number' ? item.expectedAmount : null,
        ownerUserId: item.ownerUserId || null,
        secret: item.secret,
        isActive: item.isActive !== false,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
      });
    });
  } catch (e) {
    console.error('Erro ao carregar automações do disco:', e);
  }
}

function getAutomationBySecret(secret) {
  for (const [automationId, automation] of automations.entries()) {
    if (automation.secret === secret && automation.isActive !== false) {
      return automation;
    }
  }
  return null;
}

function getAutomationStats(automationId) {
  const events = listEvents(10000);
  const callsGenerated = events.filter(e => 
    e.type === 'automation_call_created' && e.automationId === automationId
  ).length;
  return { callsGenerated };
}

// --- TELEGRAM BOT ---
function loadTelegramBots() {
  try {
    ensureDataDir();
    if (!fs.existsSync(telegramBotsFile)) return;
    const raw = fs.readFileSync(telegramBotsFile, 'utf-8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.bots) ? parsed.bots : [];
    items.forEach((item) => {
      if (!item?.userId || !item?.token) return;
      initializeTelegramBot(item.userId, item.token, item.automationId || null, item.messages || null);
    });
  } catch (e) {
    console.error('Erro ao carregar bots do Telegram:', e);
  }
}

function saveTelegramBot(userId, token, automationId, botMessages) {
  try {
    ensureDataDir();
    const store = readJson(telegramBotsFile, { bots: [] });
    store.bots = Array.isArray(store.bots) ? store.bots : [];
    const existing = store.bots.findIndex(b => b.userId === userId);
    const botData = { 
      userId, 
      token, 
      automationId: automationId || null,
      messages: botMessages || null
    };
    if (existing >= 0) {
      store.bots[existing] = botData;
    } else {
      store.bots.push(botData);
    }
    writeJson(telegramBotsFile, store);
    initializeTelegramBot(userId, token, automationId, botMessages);
  } catch (e) {
    console.error('Erro ao salvar bot do Telegram:', e);
  }
}

function deleteTelegramBot(userId) {
  try {
    ensureDataDir();
    const store = readJson(telegramBotsFile, { bots: [] });
    store.bots = Array.isArray(store.bots) ? store.bots : [];
    store.bots = store.bots.filter(b => b.userId !== userId);
    writeJson(telegramBotsFile, store);
    const bot = telegramBots.get(userId);
    if (bot) {
      bot.stopPolling();
      telegramBots.delete(userId);
    }
  } catch (e) {
    console.error('Erro ao deletar bot do Telegram:', e);
  }
}

function initializeTelegramBot(userId, token, automationId, botMessages) {
  try {
    // Parar bot existente se houver
    const existingBot = telegramBots.get(userId);
    if (existingBot) {
      existingBot.stopPolling();
    }

    // Criar novo bot
    const bot = new TelegramBot(token, { polling: true });
    
    // Armazenar estado de cada chat
    const chatState = new Map();
    
    // Obter mensagens configuradas ou usar padrão
    const messages = botMessages || {
      welcomeMessage: "🤖 Bot CallHot ativo!\n\nUse /call para gerar uma nova chamada.",
      priceTable: "",
      priceOptions: [],
      paymentConfirmation: "✅ Pagamento recebido!",
      timeSelection: "Escolha o horário:",
      timeOptions: ["AGORA", "23:00", "00:00"],
      callReadyMessage: "Está pronto? Clique no botão abaixo para iniciar a chamada:",
      callButtonText: "INICIAR CHAMADA"
    };

    // Comando /start
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcome = messages.welcomeMessage || "🤖 Bot CallHot ativo!";
      bot.sendMessage(chatId, welcome);
      
      // Se tiver tabela de preços, mostrar
      if (messages.priceTable && messages.priceOptions && messages.priceOptions.length > 0) {
        setTimeout(() => {
          showPriceMenu(bot, chatId, messages);
        }, 500);
      } else {
        // Se não tiver menu de preços, mostrar comando /call
        setTimeout(() => {
          bot.sendMessage(chatId, "Use /call para gerar uma nova chamada.");
        }, 500);
      }
    });

    // Função para mostrar menu de preços
    function showPriceMenu(bot, chatId, msgs) {
      let messageText = msgs.priceTable || "Escolha uma opção:";
      
      const buttons = [];
      msgs.priceOptions.forEach((option, index) => {
        if (index % 2 === 0) {
          buttons.push([]);
        }
        buttons[buttons.length - 1].push({
          text: option.label || `${option.duration} - R$ ${option.price}`,
          callback_data: `select_duration_${index}`
        });
      });

      bot.sendMessage(chatId, messageText, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    }

    // Handler para callbacks (botões)
    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const data = query.data;
      
      try {
        if (data.startsWith('select_duration_')) {
          const index = parseInt(data.replace('select_duration_', ''));
          const option = messages.priceOptions[index];
          
          if (!option) {
            bot.answerCallbackQuery(query.id, { text: 'Opção inválida' });
            return;
          }

          // Salvar seleção do usuário
          chatState.set(chatId, {
            selectedDuration: option.duration,
            selectedPrice: option.price,
            selectedIndex: index
          });

          // Confirmar pagamento (simulado)
          const confirmMsg = messages.paymentConfirmation 
            .replace('{duration}', option.duration)
            .replace('{price}', `R$ ${option.price}`);
          
          bot.answerCallbackQuery(query.id, { text: 'Selecionado!' });
          bot.sendMessage(chatId, confirmMsg);

          // Mostrar seleção de horário
          setTimeout(() => {
            showTimeSelection(bot, chatId, messages);
          }, 500);
        }
        else if (data.startsWith('select_time_')) {
          const time = data.replace('select_time_', '');
          chatState.set(chatId, { ...chatState.get(chatId), selectedTime: time });

          bot.answerCallbackQuery(query.id, { text: 'Horário selecionado!' });
          
          // Se for "AGORA", criar call imediatamente
          if (time === 'AGORA' || time === 'now') {
            await createCallFromBot(bot, chatId, userId, automationId, messages);
          } else {
            bot.sendMessage(chatId, `⏰ Chamada agendada para ${time}. Use /call quando estiver pronto.`);
          }
        }
        else if (data === 'start_call') {
          await createCallFromBot(bot, chatId, userId, automationId, messages);
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        bot.answerCallbackQuery(query.id, { text: 'Erro ao processar' });
      }
    });

    // Função para mostrar seleção de horário
    function showTimeSelection(bot, chatId, msgs) {
      const timeMsg = msgs.timeSelection || "Escolha o horário:";
      const buttons = [];
      
      msgs.timeOptions.forEach((time, index) => {
        if (index % 2 === 0) {
          buttons.push([]);
        }
        buttons[buttons.length - 1].push({
          text: time,
          callback_data: `select_time_${time === 'AGORA' ? 'now' : time}`
        });
      });

      bot.sendMessage(chatId, timeMsg, {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    }

    // Função para criar call
    async function createCallFromBot(bot, chatId, userId, autoId, msgs) {
      if (!autoId) {
        bot.sendMessage(chatId, '❌ Nenhuma automação configurada.');
        return;
      }

      const automation = automations.get(autoId);
      if (!automation || !automation.isActive) {
        bot.sendMessage(chatId, '❌ Automação não encontrada ou desativada.');
        return;
      }

      try {
        const callId = uuidv4();
        const state = chatState.get(chatId) || {};
        const price = state.selectedPrice || automation.expectedAmount;
        
        calls.set(callId, {
          title: automation.title || null,
          videoUrl: automation.videoUrl,
          callerName: automation.callerName || null,
          callerAvatarUrl: automation.callerAvatarUrl || null,
          expiresAt: null,
          expectedAmount: price,
          ownerUserId: userId,
          hostId: null,
          guests: new Set(),
          createdAt: new Date(),
          automationId: autoId || null
        });
        
        persistCalls();
        
        appendEvent({ 
          id: uuidv4(), 
          type: 'automation_call_created', 
          callId, 
          automationId: autoId || null,
          at: new Date().toISOString() 
        });
        
        if (price) {
          addSale({ 
            callId, 
            amount: price, 
            note: `Venda via Telegram bot - ${state.selectedDuration || 'N/A'}`, 
            userId: userId 
          });
        }

        // Obter URL base
        let baseUrl = process.env.BASE_URL;
        if (!baseUrl) {
          if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
          } else if (process.env.RENDER_EXTERNAL_URL) {
            baseUrl = process.env.RENDER_EXTERNAL_URL;
          } else {
            baseUrl = 'http://localhost:3000';
          }
        }
        const chatUrl = `${baseUrl}/ring/${callId}`;
        
        const readyMsg = msgs.callReadyMessage || "Está pronto? Clique no botão abaixo:";
        bot.sendMessage(chatId, readyMsg, {
          reply_markup: {
            inline_keyboard: [[
              { text: msgs.callButtonText || '📞 INICIAR CHAMADA', url: chatUrl }
            ]]
          }
        });

        // Limpar estado
        chatState.delete(chatId);
      } catch (error) {
        console.error('Erro ao criar call via bot:', error);
        bot.sendMessage(chatId, '❌ Erro ao criar chamada. Tente novamente.');
      }
    }

    // Comando /call - gera call via automação
    bot.onText(/\/call/, async (msg) => {
      const chatId = msg.chat.id;
      
      // Se tiver menu de preços, mostrar
      if (messages.priceTable && messages.priceOptions && messages.priceOptions.length > 0) {
        showPriceMenu(bot, chatId, messages);
      } else {
        // Senão, criar call direto
        await createCallFromBot(bot, chatId, userId, automationId, messages);
      }
    });

    // Comando /help
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 
        `📋 Comandos disponíveis:\n\n` +
        `/start - Iniciar bot\n` +
        `/call - Gerar nova chamada\n` +
        `/help - Ver esta mensagem`
      );
    });

    // Tratamento de erros
    bot.on('polling_error', (error) => {
      console.error('Erro no polling do Telegram bot:', error);
    });

    telegramBots.set(userId, bot);
    console.log(`✅ Bot do Telegram inicializado para usuário ${userId}`);
  } catch (error) {
    console.error(`Erro ao inicializar bot do Telegram para usuário ${userId}:`, error);
  }
}

function isExpired(call) {
  if (!call?.expiresAt) return false;
  const t = new Date(call.expiresAt).getTime();
  return Number.isNaN(t) ? false : Date.now() > t;
}

// Configuração Uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Apenas vídeos são permitidos'));
  }
});

const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  }
});

// Middleware Global
app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));
app.use(cookieParser());

// Auth helpers
const SESSION_COOKIE = 'cs_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getSession(sessionId) {
  const store = readJson(sessionsFile, { sessions: [] });
  const s = (store.sessions || []).find((x) => x && x.sessionId === sessionId);
  if (!s) return null;
  if (Date.now() - new Date(s.createdAt).getTime() > SESSION_MAX_AGE_MS) return null;
  return s;
}

function requireAuth(req, res, nextFn) {
  const sid = req.cookies?.[SESSION_COOKIE];
  const s = sid ? getSession(sid) : null;
  if (!s) return res.status(401).json({ error: 'Não autenticado' });
  req.userId = s.userId;
  nextFn();
}

function setSession(res, userId) {
  const store = readJson(sessionsFile, { sessions: [] });
  const sessionId = crypto.randomBytes(24).toString('hex');
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  store.sessions.push({ sessionId, userId, createdAt: new Date().toISOString() });
  writeJson(sessionsFile, store);
  res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: SESSION_MAX_AGE_MS });
}

// --- API AUTH ---
app.post('/api/auth/register', (req, res) => {
  const { username, password, inviteCode } = req.body || {};
  
  // CHAVE MESTRA: Altere 'SuaChaveSecretaAqui' para o código que você quiser
  const MASTER_INVITE_CODE = 'VIP2024'; 

  if (!username || !password) return res.status(400).json({ error: 'usuário e senha obrigatórios' });
  
  if (inviteCode !== MASTER_INVITE_CODE) {
    return res.status(403).json({ error: 'Código de convite inválido. Acesso restrito.' });
  }
  
  const store = readJson(usersFile, { users: [] });
  const exists = (store.users || []).some(u => u && (u.username || u.email || '').toLowerCase() === String(username).toLowerCase());
  
  if (exists) return res.status(409).json({ error: 'Usuário já existe' });
  
  const userId = uuidv4();
  store.users.push({ userId, username, passwordHash: bcrypt.hashSync(String(password), 10), createdAt: new Date().toISOString() });
  writeJson(usersFile, store);
  setSession(res, userId);
  res.json({ ok: true, userId, username });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'usuário e senha obrigatórios' });
  
  const store = readJson(usersFile, { users: [] });
  const user = (store.users || []).find(u => u && (u.username || u.email || '').toLowerCase() === String(username).toLowerCase());
  
  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  setSession(res, user.userId);
  res.json({ ok: true, userId: user.userId, username: user.username || user.email });
});

app.get('/api/auth/me', (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  const s = sid ? getSession(sid) : null;
  if (!s) return res.status(401).json({ error: 'Não autenticado' });
  const store = readJson(usersFile, { users: [] });
  const user = (store.users || []).find(u => u && u.userId === s.userId);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json({ ok: true, userId: user.userId, username: user.username || user.email });
});

// --- API UPLOADS ---
app.post('/api/upload-video', requireAuth, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ videoUrl: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.post('/api/upload-avatar', requireAuth, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  res.json({ avatarUrl: `/uploads/avatars/${req.file.filename}`, filename: req.file.filename });
});

// --- API CALLS ---
app.post('/api/create-call', requireAuth, (req, res) => {
  const { videoUrl, callerName, callerAvatarUrl, title, expectedAmount } = req.body;
  if (!videoUrl) return res.status(400).json({ error: 'videoUrl é obrigatório' });
  
  const callId = uuidv4();
  const amt = parseCurrencyToNumber(expectedAmount);
  
  calls.set(callId, {
    title: title || null,
    videoUrl,
    callerName: callerName || null,
    callerAvatarUrl: callerAvatarUrl || null,
    expiresAt: null,
    expectedAmount: amt,
    ownerUserId: req.userId,
    hostId: null,
    guests: new Set(),
    createdAt: new Date()
  });
  
  persistCalls();
  appendEvent({ id: uuidv4(), type: 'call_created', callId, at: new Date().toISOString(), userId: req.userId });
  if (amt) addSale({ callId, amount: amt, note: 'Venda registrada na criação', userId: req.userId });
  
  res.json({ callId, ringUrl: `/ring/${callId}` });
});

app.get('/api/calls', requireAuth, (req, res) => {
  const list = serializeCalls().filter(c => c.ownerUserId === req.userId);
  res.json({ calls: list });
});

app.get('/api/call/:callId', (req, res) => {
  const call = calls.get(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Call não encontrada' });
  if (isExpired(call)) return res.status(410).json({ error: 'Expirada' });
  res.json({
    callId: req.params.callId,
    title: call.title,
    videoUrl: call.videoUrl,
    callerName: call.callerName,
    callerAvatarUrl: call.callerAvatarUrl,
    guestsCount: call.guests.size
  });
});

app.patch('/api/call/:callId', requireAuth, (req, res) => {
  const call = calls.get(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Não encontrada' });
  if (call.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  if (req.body.expireNow) call.expiresAt = new Date(Date.now() - 1000);
  persistCalls();
  res.json({ ok: true });
});

app.delete('/api/call/:callId', requireAuth, (req, res) => {
  const call = calls.get(req.params.callId);
  if (!call) return res.status(404).json({ error: 'Não encontrada' });
  if (call.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  calls.delete(req.params.callId);
  persistCalls();
  res.json({ ok: true });
});

// --- API HISTORY & SALES ---
app.get('/api/history', requireAuth, (req, res) => {
  const events = listEvents(8000).filter(e => {
    const c = calls.get(e.callId);
    return !c || c.ownerUserId === req.userId;
  });
  res.json({ events });
});

app.get('/api/sales', requireAuth, (req, res) => {
  const sales = listSales().filter(s => {
    const c = calls.get(s.callId);
    return !c || c.ownerUserId === req.userId;
  });
  res.json({ sales });
});

app.post('/api/sales', requireAuth, (req, res) => {
  const { callId, amount } = req.body;
  const amt = parseCurrencyToNumber(amount);
  if (!amt) return res.status(400).json({ error: 'Valor inválido' });
  addSale({ callId, amount: amt, userId: req.userId });
  res.json({ ok: true });
});

app.post('/api/track', (req, res) => {
  const { callId, type } = req.body;
  if (!calls.has(callId)) return res.status(400).json({ error: 'Inválido' });
  appendEvent({ id: uuidv4(), type, callId, at: new Date().toISOString() });
  res.json({ ok: true });
});

// --- API CONVERSAS E CHAT ---
app.get('/api/conversations', requireAuth, (req, res) => {
  const list = Array.from(conversations.values())
    .filter(c => c.ownerUserId === req.userId)
    .map(c => ({
      callId: c.callId,
      callerName: c.callerName,
      messageCount: c.messages.length,
      lastMessage: c.messages[c.messages.length - 1] || null,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ conversations: list });
});

app.get('/api/conversation/:callId', requireAuth, (req, res) => {
  const conv = conversations.get(req.params.callId);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  if (conv.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  res.json({ conversation: conv });
});

app.post('/api/conversation/:callId/message', requireAuth, (req, res) => {
  const { text } = req.body;
  const conv = conversations.get(req.params.callId);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  if (conv.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  
  const message = addMessageToConversation(req.params.callId, text, false, req.userId);
  
  // Enviar via WebSocket para clientes conectados
  if (chatClients.has(req.params.callId)) {
    chatClients.get(req.params.callId).forEach(clientWs => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'new_message',
          message
        }));
      }
    });
  }
  
  res.json({ message });
});

// --- API AUTOMAÇÕES ---
// Endpoint público para gerar call a partir de automação
app.post('/api/automation/:secret', (req, res) => {
  const { secret } = req.params;
  if (!secret) return res.status(400).json({ error: 'Secret parameter is required' });
  
  // Encontrar automação pelo secret
  let automation = null;
  let automationId = null;
  for (const [id, auto] of automations.entries()) {
    if (auto.secret === secret && auto.isActive !== false) {
      automation = auto;
      automationId = id;
      break;
    }
  }
  
  if (!automation) return res.status(404).json({ error: 'Invalid automation or secret' });
  
  // Criar nova call baseada na automação
  const callId = uuidv4();
  const amt = automation.expectedAmount;
  
  calls.set(callId, {
    title: automation.title || null,
    videoUrl: automation.videoUrl,
    callerName: automation.callerName || null,
    callerAvatarUrl: automation.callerAvatarUrl || null,
    expiresAt: null,
    expectedAmount: amt,
    ownerUserId: automation.ownerUserId,
    hostId: null,
    guests: new Set(),
    createdAt: new Date(),
    automationId: automationId || null
  });
  
  persistCalls();
  
  // Registrar evento de criação via automação
  appendEvent({ 
    id: uuidv4(), 
    type: 'automation_call_created', 
    callId, 
    automationId: automationId || null,
    at: new Date().toISOString() 
  });
  
  if (amt) {
    addSale({ 
      callId, 
      amount: amt, 
      note: 'Venda registrada via automação', 
      userId: automation.ownerUserId 
    });
  }
  
  const baseUrl = req.protocol + '://' + req.get('host');
  const chatUrl = `${baseUrl}/ring/${callId}`;
  
  res.json({ 
    success: true, 
    chatUrl, 
    chatId: callId 
  });
});

// Criar automação
app.post('/api/automations', requireAuth, (req, res) => {
  const { name, title, videoUrl, callerName, callerAvatarUrl, expectedAmount } = req.body;
  if (!name || !videoUrl) return res.status(400).json({ error: 'name e videoUrl são obrigatórios' });
  
  const automationId = uuidv4();
  const secret = generateSecret();
  const amt = parseCurrencyToNumber(expectedAmount);
  
  automations.set(automationId, {
    name: String(name),
    title: title || null,
    videoUrl: String(videoUrl),
    callerName: callerName || null,
    callerAvatarUrl: callerAvatarUrl || null,
    expectedAmount: amt,
    ownerUserId: req.userId,
    secret,
    isActive: true,
    createdAt: new Date()
  });
  
  persistAutomations();
  appendEvent({ 
    id: uuidv4(), 
    type: 'automation_created', 
    automationId, 
    at: new Date().toISOString(), 
    userId: req.userId 
  });
  
  const baseUrl = req.protocol + '://' + req.get('host');
  res.json({ 
    automationId, 
    secret,
    automationUrl: `${baseUrl}/api/automation/${secret}`,
    name,
    createdAt: new Date().toISOString()
  });
});

// Listar automações do usuário
app.get('/api/automations', requireAuth, (req, res) => {
  const list = serializeAutomations()
    .filter(a => a.ownerUserId === req.userId)
    .map(a => {
      const stats = getAutomationStats(a.automationId);
      const baseUrl = req.protocol + '://' + req.get('host');
      return {
        ...a,
        automationUrl: `${baseUrl}/api/automation/${a.secret}`,
        ...stats
      };
    });
  res.json({ automations: list });
});

// Obter detalhes de uma automação
app.get('/api/automation/:automationId', requireAuth, (req, res) => {
  const { automationId } = req.params;
  const automation = automations.get(automationId);
  if (!automation) return res.status(404).json({ error: 'Automação não encontrada' });
  if (automation.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  
  const stats = getAutomationStats(automationId);
  const baseUrl = req.protocol + '://' + req.get('host');
  const serialized = serializeAutomations().find(a => a.automationId === automationId);
  
  res.json({
    ...serialized,
    automationUrl: `${baseUrl}/api/automation/${serialized.secret}`,
    ...stats
  });
});

// Atualizar automação
app.patch('/api/automation/:automationId', requireAuth, (req, res) => {
  const { automationId } = req.params;
  const automation = automations.get(automationId);
  if (!automation) return res.status(404).json({ error: 'Automação não encontrada' });
  if (automation.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  
  if (req.body.name !== undefined) automation.name = String(req.body.name);
  if (req.body.title !== undefined) automation.title = req.body.title || null;
  if (req.body.videoUrl !== undefined) automation.videoUrl = String(req.body.videoUrl);
  if (req.body.callerName !== undefined) automation.callerName = req.body.callerName || null;
  if (req.body.callerAvatarUrl !== undefined) automation.callerAvatarUrl = req.body.callerAvatarUrl || null;
  if (req.body.expectedAmount !== undefined) {
    automation.expectedAmount = parseCurrencyToNumber(req.body.expectedAmount);
  }
  if (req.body.isActive !== undefined) automation.isActive = req.body.isActive === true;
  
  persistAutomations();
  appendEvent({ 
    id: uuidv4(), 
    type: 'automation_updated', 
    automationId, 
    at: new Date().toISOString(), 
    userId: req.userId 
  });
  
  res.json({ ok: true });
});

// Deletar automação
app.delete('/api/automation/:automationId', requireAuth, (req, res) => {
  const { automationId } = req.params;
  const automation = automations.get(automationId);
  if (!automation) return res.status(404).json({ error: 'Automação não encontrada' });
  if (automation.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  
  automations.delete(automationId);
  persistAutomations();
  appendEvent({ 
    id: uuidv4(), 
    type: 'automation_deleted', 
    automationId, 
    at: new Date().toISOString(), 
    userId: req.userId 
  });
  
  res.json({ ok: true });
});

// --- API TELEGRAM BOT ---
// Configurar bot do Telegram
app.post('/api/telegram-bot', requireAuth, (req, res) => {
  const { token, automationId, messages } = req.body;
  if (!token) return res.status(400).json({ error: 'Token do bot é obrigatório' });
  
  // Validar que a automação pertence ao usuário (se fornecida)
  if (automationId) {
    const automation = automations.get(automationId);
    if (!automation) return res.status(404).json({ error: 'Automação não encontrada' });
    if (automation.ownerUserId !== req.userId) return res.status(403).json({ error: 'Sem permissão' });
  }
  
  try {
    saveTelegramBot(req.userId, token, automationId || null, messages || null);
    res.json({ ok: true, message: 'Bot configurado com sucesso!' });
  } catch (error) {
    console.error('Erro ao configurar bot:', error);
    res.status(500).json({ error: 'Erro ao configurar bot. Verifique se o token é válido.' });
  }
});

// Obter configuração do bot
app.get('/api/telegram-bot', requireAuth, (req, res) => {
  try {
    ensureDataDir();
    const store = readJson(telegramBotsFile, { bots: [] });
    const botConfig = store.bots.find(b => b.userId === req.userId);
    
    if (!botConfig) {
      return res.json({ configured: false });
    }
    
    // Não retornar o token completo por segurança
    const tokenPreview = botConfig.token ? 
      botConfig.token.substring(0, 10) + '...' + botConfig.token.substring(botConfig.token.length - 4) : 
      null;
    
    res.json({
      configured: true,
      tokenPreview,
      automationId: botConfig.automationId || null,
      automationName: botConfig.automationId ? 
        (automations.get(botConfig.automationId)?.name || null) : null,
      messages: botConfig.messages || null
    });
  } catch (error) {
    console.error('Erro ao obter configuração do bot:', error);
    res.status(500).json({ error: 'Erro ao obter configuração' });
  }
});

// Deletar bot do Telegram
app.delete('/api/telegram-bot', requireAuth, (req, res) => {
  try {
    deleteTelegramBot(req.userId);
    res.json({ ok: true, message: 'Bot removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar bot:', error);
    res.status(500).json({ error: 'Erro ao deletar bot' });
  }
});

// --- ROTAS DE PÁGINAS EXPRESS ---
app.get('/video/:callId', (req, res) => {
  const p = path.join(__dirname, 'public', 'video.html');
  if (fs.existsSync(p)) res.sendFile(p);
  else res.status(404).send('Página de vídeo não encontrada no servidor');
});

app.get('/call/:callId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'call.html'));
});

app.get('/host/:callId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

// Rota Otimizada para Streaming de Vídeos Longos (DEVE VIR ANTES DO STATIC)
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Vídeo não encontrado');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.use(express.static('public', { index: false }));
app.use('/uploads/avatars', express.static('public/uploads/avatars'));

// --- NEXT.JS INTEGRATION ---
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: __dirname });
const nextHandler = nextApp.getRequestHandler();

// WebSocket Handler para Chat
const chatClients = new Map(); // callId -> Set of WebSocket connections
const adminClients = new Map(); // userId -> Set of WebSocket connections

wss.on('connection', (ws, req) => {
  let callId = null;
  let userId = null;
  let role = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'join') {
        callId = msg.callId;
        userId = msg.userId;
        role = msg.role || 'guest';
        
        if (role === 'admin' && userId) {
          // Admin conectando ao dashboard
          if (!adminClients.has(userId)) {
            adminClients.set(userId, new Set());
          }
          adminClients.get(userId).add(ws);
          
          // Enviar histórico de conversas ativas
          const activeConvs = Array.from(conversations.values())
            .filter(c => c.active && c.ownerUserId === userId)
            .map(c => ({
              callId: c.callId,
              callerName: c.callerName,
              messageCount: c.messages.length,
              lastMessage: c.messages[c.messages.length - 1] || null,
              updatedAt: c.updatedAt
            }));
          
          ws.send(JSON.stringify({
            type: 'conversations_list',
            conversations: activeConvs
          }));
        } else if (callId) {
          // Cliente conectando durante chamada
          if (!chatClients.has(callId)) {
            chatClients.set(callId, new Set());
          }
          chatClients.get(callId).add(ws);
          
          // Enviar histórico de mensagens
          const conv = conversations.get(callId);
          if (conv) {
            ws.send(JSON.stringify({
              type: 'chat_history',
              messages: conv.messages
            }));
          }
        }
      } else if (msg.type === 'chat_message' && callId) {
        // Mensagem do cliente
        const call = calls.get(callId);
        if (!call) return;
        
        const conv = getOrCreateConversation(callId, call.callerName, call.ownerUserId);
        const message = addMessageToConversation(callId, msg.text, true, call.ownerUserId);
        
        if (message) {
          // Enviar para todos os admins do dono da call
          if (call.ownerUserId && adminClients.has(call.ownerUserId)) {
            adminClients.get(call.ownerUserId).forEach(adminWs => {
              if (adminWs.readyState === WebSocket.OPEN) {
                adminWs.send(JSON.stringify({
                  type: 'new_message',
                  callId,
                  message
                }));
              }
            });
          }
          
          // Confirmar recebimento para o cliente
          ws.send(JSON.stringify({
            type: 'message_sent',
            messageId: message.id
          }));
        }
      } else if (msg.type === 'admin_message' && msg.callId && userId) {
        // Mensagem do admin
        const conv = conversations.get(msg.callId);
        if (!conv || conv.ownerUserId !== userId) return;
        
        const message = addMessageToConversation(msg.callId, msg.text, false, userId);
        
        if (message) {
          // Enviar para todos os clientes conectados nessa call
          if (chatClients.has(msg.callId)) {
            chatClients.get(msg.callId).forEach(clientWs => {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'new_message',
                  message
                }));
              }
            });
          }
        }
      } else if (msg.type === 'join_conversation' && msg.callId && userId) {
        // Admin quer ver uma conversa específica
        const conv = conversations.get(msg.callId);
        if (conv && conv.ownerUserId === userId) {
          ws.send(JSON.stringify({
            type: 'conversation_data',
            conversation: {
              callId: conv.callId,
              callerName: conv.callerName,
              messages: conv.messages,
              active: conv.active,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt
            }
          }));
        }
      }
    } catch (e) {
      console.error('Erro ao processar mensagem WebSocket:', e);
    }
  });

  ws.on('close', () => {
    if (role === 'admin' && userId && adminClients.has(userId)) {
      adminClients.get(userId).delete(ws);
      if (adminClients.get(userId).size === 0) {
        adminClients.delete(userId);
      }
    } else if (callId && chatClients.has(callId)) {
      chatClients.get(callId).delete(ws);
      if (chatClients.get(callId).size === 0) {
        chatClients.delete(callId);
      }
    }
  });
});

app.all('*', (req, res) => nextHandler(req, res));

// Força porta 3000 para evitar conflito com projeto 1 (porta 8080)
// IMPORTANTE: No Railway, configure a porta de destino como 3000 nas Configurações → Domínios
// E remova a variável de ambiente PORT se ela estiver definida como 8080
const PORT = 3000; // Sempre usa 3000 para este projeto
const HOST = process.env.HOST || '0.0.0.0';
async function start() {
  loadCallsFromDisk();
  loadAutomationsFromDisk();
  loadTelegramBots();
  loadConversationsFromDisk();
  await nextApp.prepare();
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Rodando na porta ${PORT} (host: ${HOST})`);
  });
}
start().catch(e => {
  console.error(e);
  process.exit(1);
});
