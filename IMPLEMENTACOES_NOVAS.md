# 🚀 Novas Implementações - CallHot

## ✅ Funcionalidades Implementadas

### 1. 🔐 Login com Google (OAuth 2.0)
- Autenticação via Google usando Passport.js
- Vincula contas Google existentes ou cria novas
- Suporte a avatar do Google
- Rotas:
  - `GET /api/auth/google` - Inicia autenticação
  - `GET /api/auth/google/callback` - Callback do Google

**Configuração necessária:**
```env
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=https://seudominio.com/api/auth/google/callback
```

### 2. 📊 Banco de Dados Expandido
Novas tabelas criadas:
- **calls**: Armazena todas as chamadas criadas
- **short_links**: Links curtos para chamadas
- **password_resets**: Tokens de recuperação de senha
- **users**: Atualizado com campos `google_id`, `avatar_url`, email obrigatório

### 3. 🔗 Sistema de Links Curtos
- Gera links curtos (8 caracteres) para chamadas
- Rastreamento de cliques
- Expiração opcional
- Rotas:
  - `GET /s/:shortCode` - Redireciona para chamada
  - `GET /api/short-links` - Lista links do usuário
  - `DELETE /api/short-links/:shortCode` - Deleta link

**Uso:**
Ao criar uma chamada, passe `useShortLink: true` no body:
```json
{
  "videoUrl": "...",
  "useShortLink": true
}
```

Resposta incluirá:
```json
{
  "callId": "...",
  "ringUrl": "/ring/...",
  "shortUrl": "https://dominio.com/s/abc12345",
  "shortCode": "abc12345"
}
```

### 4. 📧 Email Obrigatório no Cadastro
- Campo email agora é obrigatório
- Validação de formato de email
- Email deve ser único
- Envio automático de email de boas-vindas

### 5. 🔑 Recuperação de Senha
- Geração de token seguro
- Envio de email com link de recuperação
- Token expira em 1 hora
- Rotas:
  - `POST /api/auth/forgot-password` - Solicita recuperação
  - `POST /api/auth/reset-password` - Redefine senha

**Uso:**
```json
// Solicitar recuperação
POST /api/auth/forgot-password
{
  "email": "usuario@email.com"
}

// Redefinir senha
POST /api/auth/reset-password
{
  "token": "token_recebido_no_email",
  "newPassword": "nova_senha123"
}
```

### 6. 🛡️ Melhorias de Segurança

#### Rate Limiting
- **Geral**: 100 requests por IP a cada 15 minutos
- **Login/Registro**: 5 tentativas por IP a cada 15 minutos

#### Helmet.js
- Headers de segurança configurados
- Proteção contra XSS, clickjacking, etc.

#### Validações
- Validação de email com `validator`
- Validação de senha (mínimo 6 caracteres)
- Sanitização de inputs

#### Banco de Dados
- Constraints de integridade
- Índices para performance
- Limpeza automática de tokens expirados

## 📦 Novas Dependências

```json
{
  "express-rate-limit": "^7.1.5",
  "helmet": "^7.1.0",
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "nodemailer": "^6.9.8",
  "nanoid": "^5.0.4",
  "validator": "^13.11.0",
  "express-session": "^1.17.3"
}
```

## 🔧 Configuração de Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=https://seudominio.com/api/auth/google/callback

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app

# Sessão
SESSION_SECRET=seu_secret_aleatorio_aqui

# Base URL (para emails e links)
BASE_URL=https://seudominio.com
```

## 📝 Migração de Dados

### Para usuários existentes sem email:
1. Execute uma migração para adicionar emails temporários
2. Ou solicite que usuários atualizem seus perfis

### Para chamadas existentes:
- As chamadas antigas continuam funcionando
- Novas chamadas são salvas no banco de dados
- Sistema híbrido mantém compatibilidade

## 🚀 Próximos Passos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar Google OAuth:**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto
   - Ative Google+ API
   - Crie credenciais OAuth 2.0
   - Adicione callback URL

3. **Configurar SMTP:**
   - Para Gmail: Use "Senha de App" (não a senha normal)
   - Para outros provedores: Ajuste host/porta

4. **Atualizar frontend:**
   - Adicionar campo email no formulário de registro
   - Adicionar botão "Entrar com Google"
   - Criar página de recuperação de senha
   - Mostrar link curto quando gerado

## ⚠️ Notas Importantes

- **Email obrigatório**: Usuários antigos sem email precisarão atualizar
- **Google OAuth**: Requer configuração no Google Cloud Console
- **SMTP**: Em desenvolvimento, emails são logados no console
- **Links curtos**: São opcionais, sistema funciona sem eles
- **Segurança**: Rate limiting pode bloquear IPs legítimos em caso de ataque

## 🔄 Compatibilidade

- Sistema mantém compatibilidade com dados antigos (JSON)
- Chamadas antigas continuam funcionando
- Usuários podem migrar gradualmente

