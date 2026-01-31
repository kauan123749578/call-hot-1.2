const { Pool } = require('pg');

// Configuração do banco de dados
// Suporta DATABASE_URL, URL_DO_BANCO_DE_DADOS (Railway) ou variáveis individuais
let poolConfig;

// Verifica qual variável de conexão está disponível
const databaseUrl = process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS || process.env.DATABASE_CONNECTION_STRING;

if (databaseUrl) {
  // Usa connection string se disponível (padrão do Railway)
  poolConfig = {
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway') || databaseUrl.includes('railway.app') || process.env.DB_SSL === 'true' 
      ? { rejectUnauthorized: false } 
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
} else {
  // Fallback para variáveis individuais (desenvolvimento local)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'callhot',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

// Log da configuração (sem senha)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB === 'true') {
  const dbUrl = process.env.DATABASE_URL || process.env.URL_DO_BANCO_DE_DADOS || 'não configurado';
  const maskedUrl = typeof dbUrl === 'string' ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'não configurado'; // Mascara a senha
  console.log('🔧 Configuração do banco:', {
    usando: databaseUrl ? 'connection string' : 'variáveis individuais',
    url: maskedUrl,
    host: poolConfig.host || (databaseUrl ? 'da connection string' : 'não definido'),
  });
}

// Testa a conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente PostgreSQL:', err);
  console.error('Detalhes:', {
    code: err.code,
    message: err.message,
    host: err.address,
    port: err.port,
  });
  // Não encerra o processo em produção, apenas loga o erro
  if (process.env.NODE_ENV === 'development') {
    process.exit(-1);
  }
});

// Função helper para executar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executada query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Erro na query:', { text, error: error.message });
    throw error;
  }
}

// Função para inicializar o banco (criar tabelas se não existirem)
async function initDatabase() {
  try {
    // Testar conexão primeiro
    console.log('🔄 Testando conexão com PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Criar tabela de usuários (apenas username + senha)
    console.log('🔄 Criando tabelas...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username))
    `);

    // Criar tabela de sessões
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(255) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Criar índice para busca rápida de sessões
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)
    `);

    // Criar tabela de calls (chamadas)
    await query(`
      CREATE TABLE IF NOT EXISTS calls (
        call_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(255),
        video_url TEXT NOT NULL,
        caller_name VARCHAR(255),
        caller_avatar_url TEXT,
        expected_amount DECIMAL(10,2),
        automation_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_calls_owner_user_id ON calls(owner_user_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC)
    `);

    // Limpar sessões expiradas
    await query(`
      DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP
    `);

    console.log('✅ Banco de dados inicializado com sucesso');
    console.log('✅ Tabelas criadas: users, sessions, calls');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    console.error('Detalhes do erro:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
    });
    throw error;
  }
}

module.exports = {
  pool,
  query,
  initDatabase,
};

