const { query } = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Fallback para arquivos JSON
const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2));
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
    console.log('⚠️  PostgreSQL não disponível, usando arquivos JSON como fallback');
    return false;
  }
}

/**
 * Busca um usuário por username
 */
async function findUserByUsername(username) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      const result = await query(
        `SELECT user_id, username, password_hash, created_at 
         FROM users 
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
      );
      
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        return {
          userId: row.user_id,
          user_id: row.user_id,
          username: row.username,
          passwordHash: row.password_hash,
          password_hash: row.password_hash,
          createdAt: row.created_at,
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário no PostgreSQL:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(usersFile, { users: [] });
  const users = Array.isArray(store.users) ? store.users : [];
  const user = users.find(u => 
    u && (u.username || '').toLowerCase() === String(username).toLowerCase()
  );
  return user || null;
}

/**
 * Busca um usuário por ID
 */
async function findUserById(userId) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      const result = await query(
        `SELECT user_id, username, password_hash, created_at FROM users WHERE user_id = $1`,
        [userId]
      );
      if (result.rows[0]) {
        const row = result.rows[0];
        return {
          userId: row.user_id,
          user_id: row.user_id,
          username: row.username,
          passwordHash: row.password_hash,
          password_hash: row.password_hash,
          createdAt: row.created_at,
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(usersFile, { users: [] });
  const user = (store.users || []).find(u => u && u.userId === userId);
  return user || null;
}

/**
 * Verifica se um usuário já existe (por username)
 */
async function userExists(username) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER($1)`,
        [username]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Erro ao verificar usuário no PostgreSQL:', error.message);
      usePostgres = false;
    }
  }
  
  const store = readJson(usersFile, { users: [] });
  return (store.users || []).some(u => 
    u && (u.username || '').toLowerCase() === String(username).toLowerCase()
  );
}

/**
 * Cria um novo usuário (username + senha)
 */
async function createUser(username, password) {
  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      await query(
        `INSERT INTO users (user_id, username, password_hash) VALUES ($1, $2, $3)`,
        [userId, username, passwordHash]
      );
      const store = readJson(usersFile, { users: [] });
      store.users = Array.isArray(store.users) ? store.users : [];
      store.users.push({
        userId,
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      writeJson(usersFile, store);
      return { userId, username };
    } catch (error) {
      console.error('Erro ao criar usuário no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  const store = readJson(usersFile, { users: [] });
  store.users = Array.isArray(store.users) ? store.users : [];
  store.users.push({
    userId,
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  writeJson(usersFile, store);
  return { userId, username };
}

/**
 * Verifica se a senha está correta
 */
function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

module.exports = {
  findUserByUsername,
  findUserById,
  userExists,
  createUser,
  verifyPassword,
};


