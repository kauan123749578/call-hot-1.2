const { query } = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Busca um usuário por username ou email
 */
async function findUserByUsernameOrEmail(usernameOrEmail) {
  const result = await query(
    `SELECT user_id, username, email, password_hash, created_at, updated_at 
     FROM users 
     WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) 
     LIMIT 1`,
    [usernameOrEmail]
  );
  return result.rows[0] || null;
}

/**
 * Busca um usuário por ID
 */
async function findUserById(userId) {
  const result = await query(
    `SELECT user_id, username, email, password_hash, created_at, updated_at 
     FROM users 
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Verifica se um usuário já existe (por username ou email)
 */
async function userExists(usernameOrEmail) {
  const result = await query(
    `SELECT COUNT(*) as count 
     FROM users 
     WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
    [usernameOrEmail]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Cria um novo usuário
 */
async function createUser(username, password, email) {
  if (!email) {
    throw new Error('Email é obrigatório');
  }
  
  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  await query(
    `INSERT INTO users (user_id, username, email, password_hash) 
     VALUES ($1, $2, $3, $4)`,
    [userId, username, email, passwordHash]
  );
  
  return {
    userId,
    username,
    email,
  };
}

/**
 * Verifica se a senha está correta
 */
function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

/**
 * Atualiza a senha de um usuário
 */
async function updatePassword(userId, newPassword) {
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  await query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [passwordHash, userId]
  );
}

/**
 * Lista todos os usuários (com paginação opcional)
 */
async function listUsers(limit = 100, offset = 0) {
  const result = await query(
    `SELECT user_id, username, email, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

/**
 * Conta o total de usuários
 */
async function countUsers() {
  const result = await query(`SELECT COUNT(*) as count FROM users`);
  return parseInt(result.rows[0].count);
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserById,
  userExists,
  createUser,
  verifyPassword,
  updatePassword,
  listUsers,
  countUsers,
};



