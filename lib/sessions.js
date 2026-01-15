const { query } = require('./db');
const crypto = require('crypto');

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Cria uma nova sessão
 */
async function createSession(userId) {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  
  await query(
    `INSERT INTO sessions (session_id, user_id, expires_at) 
     VALUES ($1, $2, $3)`,
    [sessionId, userId, expiresAt]
  );
  
  return {
    sessionId,
    userId,
    expiresAt,
  };
}

/**
 * Busca uma sessão por ID
 */
async function findSession(sessionId) {
  const result = await query(
    `SELECT session_id, user_id, created_at, expires_at 
     FROM sessions 
     WHERE session_id = $1 AND expires_at > CURRENT_TIMESTAMP`,
    [sessionId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const session = result.rows[0];
  return {
    sessionId: session.session_id,
    userId: session.user_id,
    createdAt: session.created_at,
    expiresAt: session.expires_at,
  };
}

/**
 * Remove uma sessão (logout)
 */
async function deleteSession(sessionId) {
  await query(
    `DELETE FROM sessions WHERE session_id = $1`,
    [sessionId]
  );
}

/**
 * Remove todas as sessões de um usuário
 */
async function deleteUserSessions(userId) {
  await query(
    `DELETE FROM sessions WHERE user_id = $1`,
    [userId]
  );
}

/**
 * Remove sessões expiradas
 */
async function cleanupExpiredSessions() {
  const result = await query(
    `DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`
  );
  return result.rowCount;
}

/**
 * Renova uma sessão (atualiza a data de expiração)
 */
async function renewSession(sessionId) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await query(
    `UPDATE sessions SET expires_at = $1 WHERE session_id = $2`,
    [expiresAt, sessionId]
  );
}

module.exports = {
  createSession,
  findSession,
  deleteSession,
  deleteUserSessions,
  cleanupExpiredSessions,
  renewSession,
  SESSION_MAX_AGE_MS,
};

