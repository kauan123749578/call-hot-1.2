# 🚀 Guia: Como Subir o PostgreSQL no Railway

## Opção 1: PostgreSQL no Railway (RECOMENDADO) ⭐

Esta é a forma mais fácil e recomendada para produção.

### Passo 1: Adicionar PostgreSQL no Railway

1. **Acesse seu projeto no Railway**: https://railway.app
2. **No dashboard do seu projeto**, clique em **"+ New"** ou **"Add Service"**
3. **Selecione "Database"** → **"Add PostgreSQL"**
4. O Railway criará automaticamente um serviço PostgreSQL para você

### Passo 2: Conectar o PostgreSQL ao seu App

O Railway automaticamente cria variáveis de ambiente quando você adiciona um banco. Você precisa mapeá-las para o formato que o código espera:

1. **No dashboard do seu projeto**, clique no serviço **PostgreSQL**
2. Vá em **"Variables"** ou **"Connect"**
3. Você verá variáveis como:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

### Passo 3: Configurar Variáveis de Ambiente no App

1. **No dashboard do Railway**, clique no serviço do seu **App** (não no PostgreSQL)
2. Vá em **"Variables"** ou **"Settings"** → **"Environment Variables"**
3. **Adicione a variável DATABASE_URL** (mais fácil!):

O Railway automaticamente cria a variável `DATABASE_URL` quando você adiciona um PostgreSQL. Você só precisa:

1. No serviço PostgreSQL, vá em **"Variables"**
2. Copie o valor de **`DATABASE_URL`** (ou `PGDATABASE_URL`)
3. No serviço do App, adicione:

```env
DATABASE_URL=${DATABASE_URL}
```

**OU** se preferir, o Railway pode fazer isso automaticamente:
- No serviço PostgreSQL, vá em **"Connect"** ou **"Variables"**
- Copie a **Connection String** completa
- No serviço do App, adicione como `DATABASE_URL`

**Formato da DATABASE_URL:**
```
postgresql://postgres:senha@host:porta/banco
```

**Nota:** O código agora suporta `DATABASE_URL` automaticamente! É muito mais fácil que configurar variáveis individuais.

### Passo 4: Fazer Deploy

1. **Faça commit e push** das alterações:
   ```bash
   git add .
   git commit -m "Adicionar suporte PostgreSQL"
   git push origin main
   ```

2. O Railway fará o deploy automaticamente
3. **O banco será inicializado automaticamente** quando o servidor iniciar (as tabelas serão criadas)

### Passo 5: Verificar se Funcionou

1. Vá em **"Deployments"** no Railway
2. Clique no deploy mais recente
3. Veja os **logs** - você deve ver:
   ```
   ✅ Conectado ao PostgreSQL
   ✅ Banco de dados PostgreSQL inicializado
   ```

---

## Opção 2: PostgreSQL Local (Para Desenvolvimento)

Se você quer testar localmente antes de fazer deploy:

### Passo 1: Instalar PostgreSQL

**Windows:**
1. Baixe o PostgreSQL: https://www.postgresql.org/download/windows/
2. Instale seguindo o instalador
3. Anote a senha do usuário `postgres` que você configurou

**Ou use Docker:**
```bash
docker run --name postgres-callhot -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### Passo 2: Criar Banco de Dados

1. Abra o **pgAdmin** (vem com o PostgreSQL) ou use o terminal:

```bash
# Windows (PowerShell)
psql -U postgres

# No prompt do psql, execute:
CREATE DATABASE callhot;

# Saia
\q
```

### Passo 3: Configurar Variáveis de Ambiente Local

1. Crie um arquivo `.env` na raiz do projeto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=callhot
DB_USER=postgres
DB_PASSWORD=sua-senha-aqui
DB_SSL=false
NODE_ENV=development
```

2. **Instale as dependências** (se ainda não fez):
   ```bash
   npm install
   ```

3. **Inicie o servidor**:
   ```bash
   npm start
   ```

4. O banco será inicializado automaticamente!

---

## 🔄 Migrar Dados Existentes (Opcional)

Se você já tem usuários em `data/users.json`, pode migrar:

### No Railway (Produção):

1. **Conecte-se ao PostgreSQL do Railway**:
   - No dashboard do PostgreSQL, pegue a connection string
   - Use um cliente como DBeaver, pgAdmin ou via terminal

2. **Execute o script de migração localmente** apontando para o Railway:
   ```bash
   # Configure as variáveis de ambiente temporariamente
   $env:DB_HOST="seu-host.railway.app"
   $env:DB_PORT="5432"
   $env:DB_NAME="railway"
   $env:DB_USER="postgres"
   $env:DB_PASSWORD="sua-senha"
   $env:DB_SSL="true"
   
   # Execute a migração
   node scripts/migrate-to-postgres.js
   ```

### Localmente:

```bash
# Certifique-se de que o .env está configurado
node scripts/migrate-to-postgres.js
```

---

## ✅ Verificação Final

### No Railway:

1. **Logs do App**: Deve mostrar `✅ Banco de dados PostgreSQL inicializado`
2. **Teste de Login**: Tente fazer login - deve funcionar
3. **Verificar Tabelas**: Conecte ao PostgreSQL e veja se as tabelas `users` e `sessions` foram criadas

### Localmente:

1. **Logs**: Deve mostrar `✅ Conectado ao PostgreSQL`
2. **Teste**: Tente criar um usuário ou fazer login

---

## 🚨 Troubleshooting

### Erro: "connection refused" ou "timeout"

- Verifique se as variáveis de ambiente estão corretas
- No Railway, certifique-se de que o PostgreSQL e o App estão no mesmo projeto
- Verifique se `DB_SSL=true` está configurado no Railway

### Erro: "database does not exist"

- O banco será criado automaticamente, mas se der erro, crie manualmente:
  ```sql
  CREATE DATABASE callhot;
  ```

### Erro: "relation does not exist"

- As tabelas devem ser criadas automaticamente
- Se não foram, execute manualmente:
  ```bash
  node -e "require('./lib/db').initDatabase().then(() => console.log('OK')).catch(console.error)"
  ```

---

## 📝 Resumo Rápido (Railway)

1. ✅ Adicione PostgreSQL no Railway (New → Database → PostgreSQL)
2. ✅ Configure variável de ambiente no App:
   - `DATABASE_URL` (copie do serviço PostgreSQL)
3. ✅ Faça deploy (git push)
4. ✅ Pronto! O banco será inicializado automaticamente

**Super fácil!** Só precisa de uma variável: `DATABASE_URL` 🎉

---

## 💡 Dica

O código já está preparado para criar as tabelas automaticamente quando o servidor inicia. Você só precisa:
1. Adicionar o PostgreSQL no Railway
2. Configurar as variáveis de ambiente
3. Fazer deploy

Tudo mais é automático! 🎉

