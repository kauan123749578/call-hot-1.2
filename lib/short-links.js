const { query } = require('./db');
const { nanoid } = require('nanoid');

/**
 * Gera um código curto único para o link
 */
function generateShortCode() {
  // Usa nanoid para gerar um código curto (8 caracteres)
  return nanoid(8);
}

/**
 * Cria um link curto para uma call
 */
async function createShortLink(callId, originalUrl, createdBy, expiresAt = null) {
  let shortCode;
  let attempts = 0;
  const maxAttempts = 10;

  // Garantir que o código seja único
  do {
    shortCode = generateShortCode();
    const existing = await query(
      'SELECT short_code FROM short_links WHERE short_code = $1',
      [shortCode]
    );
    if (existing.rows.length === 0) break;
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Não foi possível gerar um código único após várias tentativas');
    }
  } while (true);

  await query(
    `INSERT INTO short_links (short_code, call_id, original_url, created_by, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [shortCode, callId, originalUrl, createdBy, expiresAt]
  );

  return shortCode;
}

/**
 * Busca um link curto pelo código
 */
async function getShortLink(shortCode) {
  const result = await query(
    `SELECT sl.*, c.call_id, c.owner_user_id, c.video_url, c.title, c.caller_name
     FROM short_links sl
     JOIN calls c ON sl.call_id = c.call_id
     WHERE sl.short_code = $1
     AND (sl.expires_at IS NULL OR sl.expires_at > CURRENT_TIMESTAMP)`,
    [shortCode]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const link = result.rows[0];
  
  // Incrementar contador de cliques
  await query(
    'UPDATE short_links SET click_count = click_count + 1 WHERE short_code = $1',
    [shortCode]
  );

  return link;
}

/**
 * Lista todos os links curtos de um usuário
 */
async function getUserShortLinks(userId) {
  const result = await query(
    `SELECT sl.*, c.title, c.created_at as call_created_at
     FROM short_links sl
     JOIN calls c ON sl.call_id = c.call_id
     WHERE sl.created_by = $1
     ORDER BY sl.created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Deleta um link curto
 */
async function deleteShortLink(shortCode, userId) {
  const result = await query(
    'DELETE FROM short_links WHERE short_code = $1 AND created_by = $2',
    [shortCode, userId]
  );
  return result.rowCount > 0;
}

module.exports = {
  createShortLink,
  getShortLink,
  getUserShortLinks,
  deleteShortLink,
};

