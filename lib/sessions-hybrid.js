const { query } = require('./db');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

// Fallback para arquivos JSON
const dataDir = path.join(__dirname, '..', 'data');
const sessionsFile = path.join(dataDir, 'sessions.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(sessionsFile)) {
    fs.writeFileSync(sessionsFile, JSON.stringify({ sessions: [] }, null, 2));
  }
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

// Verifica se o PostgreSQL está disponível
let usePostgres = true;
let dbInitialized = false;

async function checkPostgresAvailable() {
  if (dbInitialized) return usePostgres;
  
  try {
    await query('SELECT 1');
    usePostgres = true;
    dbInitialized = true;
    return true;
  } catch (error) {
    usePostgres = false;
    dbInitialized = true;
    return false;
  }
}

/**
 * Cria uma nova sessão
 */
async function createSession(userId) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      await query(
        `INSERT INTO sessions (session_id, user_id, expires_at) 
         VALUES ($1, $2, $3)`,
        [sessionId, userId, expiresAt]
      );
      
      // Também salva no JSON como backup
      const store = readJson(sessionsFile, { sessions: [] });
      store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
      store.sessions.push({
        sessionId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      });
      writeJson(sessionsFile, store);
      
      return { sessionId, userId, expiresAt };
    } catch (error) {
      console.error('Erro ao criar sessão no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(sessionsFile, { sessions: [] });
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  store.sessions.push({
    sessionId,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  writeJson(sessionsFile, store);
  
  return { sessionId, userId, expiresAt };
}

/**
 * Busca uma sessão por ID
 */
async function findSession(sessionId) {
  if (!sessionId) return null;
  
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      const result = await query(
        `SELECT session_id, user_id, created_at, expires_at 
         FROM sessions 
         WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP`,
        [sessionId]
      );
      
      if (result.rows.length > 0) {
        const session = result.rows[0];
        return {
          sessionId: session.session_id,
          userId: session.user_id,
          createdAt: session.created_at,
          expiresAt: session.expires_at,
        };
      }
    } catch (error) {
      console.error('Erro ao buscar sessão no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(sessionsFile, { sessions: [] });
  const sessions = Array.isArray(store.sessions) ? store.sessions : [];
  const session = sessions.find(s => {
    if (!s || s.sessionId !== sessionId) return false;
    const expiresAt = new Date(s.expiresAt || s.createdAt);
    return expiresAt.getTime() > Date.now();
  });
  
  if (!session) return null;
  
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: new Date(session.expiresAt),
  };
}

/**
 * Remove uma sessão (logout)
 */
async function deleteSession(sessionId) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      await query(`DELETE FROM sessions WHERE session_id = $1`, [sessionId]);
    } catch (error) {
      console.error('Erro ao deletar sessão no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(sessionsFile, { sessions: [] });
  store.sessions = Array.isArray(store.sessions) 
    ? store.sessions.filter(s => s && s.sessionId !== sessionId)
    : [];
  writeJson(sessionsFile, store);
}

module.exports = {
  createSession,
  findSession,
  deleteSession,
  SESSION_MAX_AGE_MS,
};



