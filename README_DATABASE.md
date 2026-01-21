# Configuração do Banco de Dados PostgreSQL

Este projeto agora usa PostgreSQL para armazenar usuários e sessões.

## 📋 Pré-requisitos

1. PostgreSQL instalado localmente ou acesso a um banco PostgreSQL (Railway, Supabase, etc.)
2. Node.js e npm instalados

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=callhot
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
NODE_ENV=development
```

**Para produção (Railway):**
- Use as variáveis de ambiente fornecidas pelo Railway
- Defina `DB_SSL=true` se necessário

### 3. Criar banco de dados

```bash
# Conecte-se ao PostgreSQL
psql -U postgres

# Crie o banco de dados
CREATE DATABASE callhot;

# Saia do psql
\q
```

### 4. Executar migração (opcional)

Se você já tem dados em arquivos JSON (`data/users.json` e `data/sessions.json`), execute a migração:

```bash
node scripts/migrate-to-postgres.js
```

Este script irá:
- Criar as tabelas necessárias
- Migrar usuários existentes
- Migrar sessões existentes
- Limpar sessões expiradas

## 📊 Estrutura do Banco de Dados

### Tabela `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | UUID | ID único do usuário (chave primária) |
| username | VARCHAR(255) | Nome de usuário (único) |
| email | VARCHAR(255) | Email (opcional) |
| password_hash | VARCHAR(255) | Hash da senha (bcrypt) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de última atualização |

### Tabela `sessions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| session_id | VARCHAR(255) | ID da sessão (chave primária) |
| user_id | UUID | ID do usuário (foreign key) |
| created_at | TIMESTAMP | Data de criação |
| expires_at | TIMESTAMP | Data de expiração |

## 🔧 Comandos Úteis

### Verificar conexão

O servidor irá tentar conectar automaticamente ao iniciar. Verifique os logs para confirmar a conexão.

### Limpar sessões expiradas

As sessões expiradas são limpas automaticamente, mas você pode executar manualmente:

```javascript
const { cleanupExpiredSessions } = require('./lib/sessions');
await cleanupExpiredSessions();
```

## 🚨 Troubleshooting

### Erro de conexão

1. Verifique se o PostgreSQL está rodando
2. Verifique as credenciais no arquivo `.env`
3. Verifique se o banco de dados existe

### Erro "relation does not exist"

Execute a inicialização do banco:

```bash
node -e "require('./lib/db').initDatabase().then(() => console.log('OK')).catch(console.error)"
```

### Migrar dados existentes

Se você já tem usuários em `data/users.json`, execute:

```bash
node scripts/migrate-to-postgres.js
```

## 📝 Notas

- Os arquivos JSON antigos (`data/users.json`, `data/sessions.json`) são mantidos como backup
- Você pode removê-los após confirmar que tudo está funcionando
- As sessões expiram automaticamente após 30 dias



