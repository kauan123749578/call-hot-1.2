# CallHot

Sistema completo para criar **simulador de chamada por link** (tela "está te ligando" + "atender/recusar" + vídeo em tela cheia) e modo híbrido opcional (vídeo + voz ao vivo via WebRTC).

## 🎯 Funcionalidades

### Core
- ✅ **Dashboard completo** - Interface moderna para gerenciar calls
- ✅ **Upload de vídeo** - Faça upload de vídeos diretamente no sistema
- ✅ **Vídeo pré-gravado** - Reproduzido localmente no cliente
- ✅ **Voz ao vivo** - Host transmite áudio via WebRTC
- ✅ **Sincronização** - Vídeo e áudio sincronizados
- ✅ **Múltiplos clientes** - Suporte a vários participantes simultâneos
- ✅ **Sistema de autenticação** - Login e registro com código de convite

### 🚀 Novas Funcionalidades

- ✅ **Sistema de Automações** - Links privados reutilizáveis que geram calls automaticamente
- ✅ **API Pública** - Endpoint `/api/automation/[secret]` para integração externa
- ✅ **Integração Telegram Bot** - Bot completo com fluxo de mensagens personalizável
- ✅ **Botões Interativos** - Seleção de preços, horários e confirmações
- ✅ **Documentação da API** - Página completa com exemplos de uso
- ✅ **Estatísticas** - Rastreamento de calls geradas por automação

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar Servidor

```bash
npm start
```

Ou em modo desenvolvimento:

```bash
npm run dev
```

O servidor iniciará em `http://localhost:3000`

### 3. Criar uma Call

**Opção 1: Dashboard (Recomendado)**
1. Acesse `http://localhost:3000`
2. Faça login ou registre-se
3. Faça upload de um vídeo ou cole a URL
4. Configure título, nome do remetente, avatar
5. Clique em "Criar Call"
6. Você receberá o link da call

**Opção 2: Automação (Para Vendas)**
1. Acesse `/automations`
2. Crie uma automação com seu vídeo
3. Copie o link de automação
4. Use em landing pages, emails, etc.
5. Cada acesso gera uma call única

## 🔥 Sistema de Automações

### Como Funciona

1. **Criar Automação**: Acesse `/automations` e crie uma automação com vídeo, título, avatar, etc.
2. **Obter Link**: O sistema gera um link privado: `https://seudominio.com/api/automation/abc123xyz`
3. **Compartilhar**: Use o link em landing pages, emails, CRMs, etc.
4. **Gerar Calls**: Cada POST no link cria uma nova sala única e isolada
5. **Rastrear**: Veja estatísticas de quantas calls cada automação gerou

### API Pública

```javascript
// Exemplo de uso em uma landing page
async function gerarChamada() {
  const response = await fetch(
    'https://seudominio.com/api/automation/abc123xyz',
    { method: 'POST' }
  );
  const data = await response.json();
  
  if (data.success) {
    window.location.href = data.chatUrl;
  }
}
```

**Endpoint**: `POST /api/automation/:secret`

**Resposta**:
```json
{
  "success": true,
  "chatUrl": "https://seudominio.com/ring/clx123abc456",
  "chatId": "clx123abc456"
}
```

Veja a documentação completa em `/api-docs`

## 🤖 Integração Telegram Bot

### Configuração

1. Crie um bot no [@BotFather](https://t.me/BotFather)
2. Copie o token fornecido
3. Acesse `/automations` → "Conectar Bot Telegram"
4. Configure mensagens personalizadas, preços e horários
5. Vincule uma automação ao bot

### Comandos do Bot

- `/start` - Mensagem de boas-vindas personalizada
- `/call` - Gera nova chamada via automação
- `/help` - Lista comandos disponíveis

### Fluxo Personalizável

- ✅ Mensagem de boas-vindas
- ✅ Tabela de preços com botões interativos
- ✅ Confirmação de pagamento
- ✅ Seleção de horário (AGORA, 23:00, etc.)
- ✅ Botão para iniciar chamada

## 📁 Estrutura do Projeto

```
call-hot/
├── server.js              # Backend (Express + WebSocket + Automações + Telegram)
├── package.json           # Dependências
├── app/
│   ├── page.tsx          # Dashboard principal
│   ├── automations/       # Gerenciamento de automações
│   ├── api-docs/          # Documentação da API
│   ├── history/           # Histórico de eventos
│   ├── sales/             # Vendas
│   └── ring/[callId]/     # Página de chamada
├── components/            # Componentes React
├── lib/                   # Utilitários
├── data/                  # Armazenamento (JSON)
│   ├── automations.json   # Automações
│   ├── telegram-bots.json # Configurações de bots
│   └── ...
└── public/
    └── uploads/           # Vídeos e avatares
```

## 🎛️ Controles do Host

- **Microfone**: Ativa/desativa captura de áudio ao vivo

## 🌐 Deploy

### Opções de Deploy

1. **Render**: Use o `render.yaml` incluído
2. **Railway**: Conecte o repositório
3. **Vercel/Netlify**: Para frontend + backend serverless
4. **VPS**: DigitalOcean, AWS EC2, etc.

### Variáveis de Ambiente

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://seudominio.com  # Para Telegram Bot
```

## 📝 Notas Técnicas

- **Latência**: WebRTC tem ~100-300ms de latência
- **Navegadores**: Funciona em Chrome, Firefox, Edge (não Safari iOS)
- **HTTPS**: Necessário para WebRTC em produção (exceto localhost)
- **STUN/TURN**: Configure servidores TURN para melhor conectividade

## 🐛 Troubleshooting

### Microfone não funciona
- Verifique permissões do navegador
- Use HTTPS em produção
- Teste em diferentes navegadores

### Áudio não chega
- Verifique firewall/NAT
- Configure servidores TURN
- Verifique console do navegador para erros

### Vídeo não carrega
- Verifique CORS na URL do vídeo
- Use formatos compatíveis (MP4, WebM)
- Teste a URL diretamente no navegador

## 📄 Licença

MIT

---

Feito com ❤️ para criar experiências premium de comunicação
