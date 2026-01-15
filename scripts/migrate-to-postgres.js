/**
 * Script de migração: Move dados de arquivos JSON para PostgreSQL
 * 
 * Uso: node scripts/migrate-to-postgres.js
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, query } = require('../lib/db');
const { createUser } = require('../lib/users');
const { createSession } = require('../lib/sessions');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function migrateUsers() {
  console.log('📦 Migrando usuários...');
  const store = readJson(usersFile, { users: [] });
  const users = Array.isArray(store.users) ? store.users : [];
  
  if (users.length === 0) {
    console.log('   Nenhum usuário encontrado para migrar');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    try {
      if (!user.userId || !user.username || !user.passwordHash) {
        console.log(`   ⚠️  Pulando usuário inválido:`, user);
        skipped++;
        continue;
      }

      // Verificar se já existe
      const exists = await query(
        `SELECT user_id FROM users WHERE user_id = $1`,
        [user.userId]
      );

      if (exists.rows.length > 0) {
        console.log(`   ⏭️  Usuário ${user.username} já existe, pulando...`);
        skipped++;
        continue;
      }

      // Inserir usuário
      await query(
        `INSERT INTO users (user_id, username, email, password_hash, created_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.userId,
          user.username || user.email,
          user.email || null,
          user.passwordHash,
          user.createdAt || new Date().toISOString(),
        ]
      );

      migrated++;
      console.log(`   ✅ Migrado: ${user.username || user.email}`);
    } catch (error) {
      console.error(`   ❌ Erro ao migrar usuário ${user.username}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Migração de usuários concluída: ${migrated} migrados, ${skipped} pulados, ${errors} erros\n`);
}

async function migrateSessions() {
  console.log('📦 Migrando sessões...');
  const store = readJson(sessionsFile, { sessions: [] });
  const sessions = Array.isArray(store.sessions) ? store.sessions : [];
  
  if (sessions.length === 0) {
    console.log('   Nenhuma sessão encontrada para migrar');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const session of sessions) {
    try {
      if (!session.sessionId || !session.userId) {
        console.log(`   ⚠️  Pulando sessão inválida`);
        skipped++;
        continue;
      }

      // Verificar se o usuário existe
      const userExists = await query(
        `SELECT user_id FROM users WHERE user_id = $1`,
        [session.userId]
      );

      if (userExists.rows.length === 0) {
        console.log(`   ⚠️  Usuário ${session.userId} não encontrado, pulando sessão`);
        skipped++;
        continue;
      }

      // Verificar se já existe
      const exists = await query(
        `SELECT session_id FROM sessions WHERE session_id = $1`,
        [session.sessionId]
      );

      if (exists.rows.length > 0) {
        skipped++;
        continue;
      }

      // Calcular expires_at baseado no createdAt + 30 dias
      const createdAt = new Date(session.createdAt || new Date());
      const expiresAt = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Inserir sessão
      await query(
        `INSERT INTO sessions (session_id, user_id, created_at, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [session.sessionId, session.userId, createdAt, expiresAt]
      );

      migrated++;
    } catch (error) {
      console.error(`   ❌ Erro ao migrar sessão:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Migração de sessões concluída: ${migrated} migradas, ${skipped} puladas, ${errors} erros\n`);
}

async function main() {
  console.log('🚀 Iniciando migração para PostgreSQL...\n');

  try {
    // Inicializar banco de dados (criar tabelas)
    await initDatabase();

    // Migrar usuários
    await migrateUsers();

    // Migrar sessões
    await migrateSessions();

    // Limpar sessões expiradas
    const { cleanupExpiredSessions } = require('../lib/sessions');
    const cleaned = await cleanupExpiredSessions();
    console.log(`🧹 Limpeza: ${cleaned} sessões expiradas removidas\n`);

    console.log('✅ Migração concluída com sucesso!');
    console.log('\n💡 Dica: Você pode manter os arquivos JSON como backup ou removê-los após verificar que tudo está funcionando.');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateUsers, migrateSessions };

