const { query } = require('./db');
const { nanoid } = require('nanoid');
const crypto = require('crypto');

/**
 * Gera um token seguro para recuperação de senha
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cria um token de recuperação de senha
 */
async function createPasswordResetToken(userId) {
  const token = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token expira em 1 hora

  // Invalidar tokens anteriores do mesmo usuário
  await query(
    'UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE',
    [userId]
  );

  await query(
    `INSERT INTO password_resets (reset_token, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );

  return token;
}

/**
 * Valida um token de recuperação de senha
 */
async function validateResetToken(token) {
  const result = await query(
    `SELECT pr.*, u.email, u.username
     FROM password_resets pr
     JOIN users u ON pr.user_id = u.user_id
     WHERE pr.reset_token = $1
     AND pr.expires_at > CURRENT_TIMESTAMP
     AND pr.used = FALSE`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Marca um token como usado
 */
async function markTokenAsUsed(token) {
  await query(
    'UPDATE password_resets SET used = TRUE WHERE reset_token = $1',
    [token]
  );
}

/**
 * Limpa tokens expirados
 */
async function cleanupExpiredTokens() {
  await query(
    'DELETE FROM password_resets WHERE expires_at < CURRENT_TIMESTAMP OR used = TRUE'
  );
}

module.exports = {
  createPasswordResetToken,
  validateResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
};

