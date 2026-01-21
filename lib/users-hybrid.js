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
 * Busca um usuário por username ou email
 */
async function findUserByUsernameOrEmail(usernameOrEmail) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      console.log(`🔍 Buscando usuário no PostgreSQL: ${usernameOrEmail}`);
      const result = await query(
        `SELECT user_id, username, email, password_hash, created_at, updated_at 
         FROM users 
         WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($1))
         LIMIT 1`,
        [usernameOrEmail]
      );
      
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        console.log(`✅ Usuário encontrado no PostgreSQL: ${row.username} (ID: ${row.user_id})`);
        return {
          userId: row.user_id,
          user_id: row.user_id, // Compatibilidade
          username: row.username,
          email: row.email,
          passwordHash: row.password_hash,
          password_hash: row.password_hash, // Compatibilidade
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
      console.log(`⚠️  Usuário não encontrado no PostgreSQL: ${usernameOrEmail}`);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário no PostgreSQL:', error.message);
      console.error('Stack:', error.stack);
      usePostgres = false;
    }
  } else {
    console.log(`⚠️  PostgreSQL não disponível, buscando em JSON: ${usernameOrEmail}`);
  }
  
  // Fallback para JSON
  const store = readJson(usersFile, { users: [] });
  const users = Array.isArray(store.users) ? store.users : [];
  console.log(`📁 Total de usuários no JSON: ${users.length}`);
  
  const user = users.find(u => 
    u && (u.username || u.email || '').toLowerCase() === String(usernameOrEmail).toLowerCase()
  );
  
  if (user) {
    console.log(`✅ Usuário encontrado no JSON: ${user.username || user.email}`);
  } else {
    console.log(`❌ Usuário não encontrado no JSON: ${usernameOrEmail}`);
  }
  
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
        `SELECT user_id, username, email, password_hash, created_at, updated_at 
         FROM users 
         WHERE user_id = $1`,
        [userId]
      );
      if (result.rows[0]) {
        const row = result.rows[0];
        return {
          userId: row.user_id,
          user_id: row.user_id, // Compatibilidade
          username: row.username,
          email: row.email,
          passwordHash: row.password_hash,
          password_hash: row.password_hash, // Compatibilidade
          createdAt: row.created_at,
          updatedAt: row.updated_at,
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
 * Verifica se um usuário já existe (por username ou email)
 */
async function userExists(usernameOrEmail) {
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count 
         FROM users 
         WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
        [usernameOrEmail]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Erro ao verificar usuário no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(usersFile, { users: [] });
  return (store.users || []).some(u => 
    u && (u.username || u.email || '').toLowerCase() === String(usernameOrEmail).toLowerCase()
  );
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
  
  const useDb = await checkPostgresAvailable();
  
  if (useDb) {
    try {
      await query(
        `INSERT INTO users (user_id, username, email, password_hash) 
         VALUES ($1, $2, $3, $4)`,
        [userId, username, email, passwordHash]
      );
      
      // Também salva no JSON como backup
      const store = readJson(usersFile, { users: [] });
      store.users = Array.isArray(store.users) ? store.users : [];
      store.users.push({
        userId,
        username,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      writeJson(usersFile, store);
      
      return { userId, username, email };
    } catch (error) {
      console.error('Erro ao criar usuário no PostgreSQL, usando JSON:', error.message);
      usePostgres = false;
    }
  }
  
  // Fallback para JSON
  const store = readJson(usersFile, { users: [] });
  store.users = Array.isArray(store.users) ? store.users : [];
  store.users.push({
    userId,
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  writeJson(usersFile, store);
  
  return { userId, username, email };
}

/**
 * Verifica se a senha está correta
 */
function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserById,
  userExists,
  createUser,
  verifyPassword,
};


