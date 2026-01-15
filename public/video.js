(() => {
  function getCallIdFromPath() {
    const match = window.location.pathname.match(/\/video\/([^\/]+)/);
    return match ? match[1] : null;
  }

  function setStatus(msg) {
    const el = document.getElementById('statusPill');
    if (el) el.textContent = msg;
  }

  function setCaller(name) {
    const el = document.getElementById('callerText');
    if (el) el.textContent = name ? `Em chamada com ${name}` : 'Em chamada…';
  }

  async function safePlay(videoEl, overlayEl) {
    try {
      await videoEl.play();
      overlayEl.classList.add('hidden');
      return true;
    } catch {
      overlayEl.classList.remove('hidden');
      return false;
    }
  }

  async function init() {
    const callId = getCallIdFromPath();
    const mainVideo = document.getElementById('mainVideo');
    const overlay = document.getElementById('startOverlay');
    const startBtn = document.getElementById('startBtn');
    const endedOverlay = document.getElementById('endedOverlay');
    const hangupBtn = document.getElementById('hangupBtn');
    const cameraBtn = document.getElementById('cameraBtn');
    const micBtn = document.getElementById('micBtn');
    const selfWrap = document.getElementById('selfPreviewWrap');
    const selfVideo = document.getElementById('selfPreview');
    
    // Chat elements
    const chatBtn = document.getElementById('chatBtn');
    const chatContainer = document.getElementById('chatContainer');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    
    let selfStream = null;
    let secondsElapsed = 0;
    let timerInterval = null;
    let chatOpen = false;
    let messages = [];
    let micMuted = false;

    function startTimer() {
      if (timerInterval) return;
      const timerEl = document.getElementById('timerText');
      timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        if (timerEl) timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
    }

    if (!callId) {
      setStatus('Call inválida');
      overlay.classList.remove('hidden');
      startBtn.textContent = 'Voltar';
      startBtn.onclick = () => window.location.href = '/';
      return;
    }

    hangupBtn.addEventListener('click', () => {
      if (timerInterval) clearInterval(timerInterval);
      
      // Esconde o vídeo e os controles para não sobrar rastro
      mainVideo.style.display = 'none';
      document.querySelector('.controls').style.display = 'none';
      document.querySelector('.topbar').style.display = 'none';
      document.getElementById('selfPreviewWrap').style.display = 'none';

      try {
        mainVideo.pause();
        mainVideo.src = "";
        mainVideo.load();
      } catch {}

      try {
        if (selfStream) selfStream.getTracks().forEach(t => t.stop());
      } catch {}

      setStatus('Encerrada');
      endedOverlay.classList.remove('hidden');
    });

    startBtn.addEventListener('click', async () => {
      const ok = await safePlay(mainVideo, overlay);
      if (ok) startTimer();
    });

    const muteBtn = document.getElementById('muteBtn');
    let muted = false;

    muteBtn?.addEventListener('click', () => {
      muted = !muted;
      muteBtn.classList.toggle('btn-active', muted);
      const label = muteBtn.querySelector('.btn-label');
      if (label) label.textContent = muted ? 'Mudo' : 'Voz';
    });

    cameraBtn.addEventListener('click', async () => {
      const label = cameraBtn.querySelector('.btn-label');
      if (selfStream) {
        // Desligar câmera
        try {
          selfStream.getTracks().forEach(t => t.stop());
          selfStream = null;
          selfVideo.srcObject = null;
          selfWrap.style.display = 'none';
          if (label) label.textContent = 'Vídeo';
          cameraBtn.classList.remove('btn-active');
        } catch (e) {
          console.error('Erro ao desligar câmera:', e);
        }
      } else {
        // Ligar câmera
        if (label) label.textContent = 'Ativando...';
        try {
          selfStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          selfVideo.srcObject = selfStream;
          selfWrap.style.display = 'block';
          if (label) label.textContent = 'Vídeo';
          cameraBtn.classList.add('btn-active');
        } catch (e) {
          console.error('Erro ao ligar câmera:', e);
          if (label) label.textContent = 'Vídeo';
          alert('Não foi possível acessar a câmera. Verifique as permissões.');
        }
      }
    });

    // Chat functionality com WebSocket
    let chatWs = null;
    let videoEnded = false;
    let hasWatchedVideo = false;
    
    function connectChatWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      chatWs = new WebSocket(wsUrl);
      
      chatWs.onopen = () => {
        chatWs.send(JSON.stringify({
          type: 'join',
          callId: callId,
          role: 'guest'
        }));
      };
      
      chatWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_history' && Array.isArray(data.messages)) {
            // Carregar histórico - limpar mensagens primeiro
            chatMessages.innerHTML = '';
            messages = [];
            data.messages.forEach(msg => {
              // fromUser: true = cliente (roxo direita), fromUser: false = admin (cinza esquerda)
              addMessage(msg.text, msg.fromUser, false, msg.id);
            });
          } else if (data.type === 'new_message' && data.message) {
            // Nova mensagem recebida do admin ou confirmação da mensagem enviada
            // fromUser: false = admin (cinza esquerda), fromUser: true = cliente (roxo direita)
            
            // Verificar se já existe mensagem com este ID (evitar duplicação)
            const exists = messages.some(m => m.id === data.message.id);
            if (exists) return;
            
            // Se for uma mensagem do cliente (fromUser: true), pode ser confirmação
            // Remover mensagem temporária se existir (mesmo texto e fromUser)
            if (data.message.fromUser) {
              // Remover da lista de mensagens
              const tempIndex = messages.findIndex(m => 
                m.id.startsWith('temp-') && 
                m.text === data.message.text && 
                m.isUser === data.message.fromUser
              );
              if (tempIndex !== -1) {
                messages.splice(tempIndex, 1);
                // Remover do DOM - procurar pelo texto e classe
                const messageDivs = chatMessages.querySelectorAll('.chat-message.user');
                messageDivs.forEach(div => {
                  if (div.textContent.trim() === data.message.text.trim()) {
                    div.remove();
                  }
                });
              }
            }
            
            addMessage(data.message.text, data.message.fromUser, false, data.message.id);
          }
        } catch (e) {
          console.error('Erro ao processar mensagem WebSocket:', e);
        }
      };
      
      chatWs.onerror = () => {
        console.error('Erro na conexão WebSocket do chat');
      };
      
      chatWs.onclose = () => {
        // Reconectar após 3 segundos se não foi intencional
        if (!videoEnded) {
          setTimeout(() => {
            if (!videoEnded) connectChatWebSocket();
          }, 3000);
        }
      };
    }
    
    function toggleChat() {
      chatOpen = !chatOpen;
      if (chatOpen) {
        chatContainer.classList.add('open');
        chatBtn.classList.add('active');
        chatInput.focus();
      } else {
        chatContainer.classList.remove('open');
        chatBtn.classList.remove('active');
      }
    }

    function addMessage(text, isUser = true, sendToServer = true, messageId = null) {
      // Remove empty message placeholder
      const emptyMsg = chatMessages.querySelector('.chat-empty');
      if (emptyMsg) emptyMsg.remove();

      // Verificar se mensagem já existe (usando ID ou texto+timestamp)
      if (messageId) {
        const exists = messages.some(m => m.id === messageId);
        if (exists) return;
      }

      const messageDiv = document.createElement('div');
      if (messageId) messageDiv.setAttribute('data-msg-id', messageId);
      messageDiv.className = `chat-message ${isUser ? 'user' : 'other'}`;
      messageDiv.textContent = text;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      messages.push({ id: messageId || `temp-${Date.now()}`, text, isUser, timestamp: Date.now() });
      
      // Enviar para servidor se for mensagem do usuário
      if (sendToServer && isUser && chatWs && chatWs.readyState === WebSocket.OPEN) {
        chatWs.send(JSON.stringify({
          type: 'chat_message',
          callId: callId,
          text: text
        }));
      }
    }

    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;

      addMessage(text, true, true);
      chatInput.value = '';
    }

    chatBtn.addEventListener('click', toggleChat);
    chatCloseBtn.addEventListener('click', toggleChat);
    
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Conectar WebSocket do chat
    connectChatWebSocket();

    setStatus('Carregando...');

    try {
      const resp = await fetch(`/api/call/${encodeURIComponent(callId)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setStatus('Call não encontrada');
        overlay.classList.remove('hidden');
        startBtn.textContent = 'Voltar';
        startBtn.onclick = () => window.location.href = '/';
        return;
      }

      setCaller(data.callerName || 'Bia');
      setStatus('Conectado');

      mainVideo.src = data.videoUrl;
      mainVideo.playsInline = true;

      // Quando o vídeo acabar, encerra a chamada automaticamente
      mainVideo.onended = () => {
        videoEnded = true;
        hasWatchedVideo = true;
        
        // Fechar WebSocket do chat
        if (chatWs) {
          chatWs.close();
          chatWs = null;
        }
        
        // Marcar que o vídeo foi assistido (prevenir reload)
        try {
          sessionStorage.setItem(`video_watched_${callId}`, 'true');
        } catch {}
        
        hangupBtn.click();
      };
      
      // Verificar se já assistiu o vídeo antes (ANTES de carregar)
      try {
        if (sessionStorage.getItem(`video_watched_${callId}`) === 'true') {
          // Se já assistiu, redirecionar imediatamente
          window.location.href = '/';
          return;
        }
      } catch {}
      
      // Proteção contra reload após assistir o vídeo
      window.addEventListener('beforeunload', (e) => {
        if (hasWatchedVideo || videoEnded) {
          e.preventDefault();
          e.returnValue = 'A chamada já foi encerrada. Você não pode recarregar a página.';
          return e.returnValue;
        }
      });
      
      // Prevenir reload via F5 ou Ctrl+R
      window.addEventListener('keydown', (e) => {
        if ((e.key === 'F5') || (e.ctrlKey && e.key === 'r') || (e.ctrlKey && e.key === 'R')) {
          if (hasWatchedVideo || videoEnded) {
            e.preventDefault();
            alert('A chamada já foi encerrada. Você não pode recarregar a página.');
            return false;
          }
        }
      });
      
      // Marcar que iniciou a visualização
      mainVideo.addEventListener('play', () => {
        hasWatchedVideo = true;
        try {
          sessionStorage.setItem(`video_started_${callId}`, 'true');
        } catch {}
      }, { once: true });
      
      // Prevenir reload após término
      mainVideo.addEventListener('ended', () => {
        // Desabilitar botão de reload do navegador
        try {
          sessionStorage.setItem(`video_watched_${callId}`, 'true');
        } catch {}
      });

      // tenta autoplay (pode falhar por política do navegador)
      const ok = await safePlay(mainVideo, overlay);
      if (ok) startTimer();

      mainVideo.addEventListener('error', () => {
        setStatus('Erro ao carregar vídeo');
        overlay.classList.remove('hidden');
        document.querySelector('.overlay-sub').textContent = 'Não foi possível carregar o vídeo dessa call.';
        startBtn.textContent = 'Voltar';
        startBtn.onclick = () => window.location.href = '/';
      });
    } catch {
      setStatus('Erro de rede');
      overlay.classList.remove('hidden');
      startBtn.textContent = 'Tentar novamente';
      startBtn.onclick = () => window.location.reload();
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();


