# 🔥 Como Funciona a API de Automações

## 📖 Conceito

A **API de Automações** permite criar **links reutilizáveis** que geram calls automaticamente. É ideal para:
- Landing pages de vendas
- Emails marketing
- Integrações com CRMs
- Bots do Telegram
- Qualquer sistema que precise gerar calls automaticamente

---

## 🔄 Fluxo Completo

### **Passo 1: Criar uma Automação**

Você cria uma automação no painel (`/automations`) com:
- **Nome**: Identificação da automação
- **Vídeo**: URL do vídeo que será exibido
- **Título**: Título da chamada (opcional)
- **Nome do Remetente**: Nome que aparece na chamada (opcional)
- **Avatar**: Foto do remetente (opcional)
- **Valor Esperado**: Preço da chamada (opcional)

**O que acontece:**
1. Sistema gera um `automationId` único
2. Sistema gera um `secret` (chave privada) único
3. Você recebe um link: `https://seudominio.com/api/automation/abc123xyz`

---

### **Passo 2: Usar o Link de Automação**

O link gerado é **reutilizável** e **público** (não precisa autenticação).

**Cada vez que você faz um POST nesse link:**
1. Sistema verifica se o `secret` existe e está ativo
2. Cria uma **nova call única** com os dados da automação
3. Retorna o link da call criada

---

### **Passo 3: Cliente Acessa a Call**

O cliente recebe o link da call e pode:
- Ver a tela "está te ligando"
- Atender ou recusar
- Assistir ao vídeo
- Interagir com o host (se houver)

---

## 🔌 Endpoints da API

### **1. Criar Automação** (Privado - Requer Login)

```http
POST /api/automations
Authorization: Cookie (sessão)
Content-Type: application/json

{
  "name": "Apresentação do Produto",
  "title": "Conheça nosso produto",
  "videoUrl": "https://exemplo.com/video.mp4",
  "callerName": "João Silva",
  "callerAvatarUrl": "https://exemplo.com/avatar.jpg",
  "expectedAmount": 50.00
}
```

**Resposta:**
```json
{
  "automationId": "abc-123-def",
  "secret": "xyz789secret",
  "automationUrl": "https://seudominio.com/api/automation/xyz789secret",
  "name": "Apresentação do Produto",
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

---

### **2. Gerar Call via Automação** (Público - Não Requer Login)

```http
POST /api/automation/[secret]
```

**Exemplo:**
```http
POST https://seudominio.com/api/automation/xyz789secret
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "chatUrl": "https://seudominio.com/ring/clx123abc456",
  "chatId": "clx123abc456"
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Invalid automation or secret"
}
```

---

### **3. Listar Automações** (Privado - Requer Login)

```http
GET /api/automations
Authorization: Cookie (sessão)
```

**Resposta:**
```json
{
  "automations": [
    {
      "automationId": "abc-123-def",
      "name": "Apresentação do Produto",
      "secret": "xyz789secret",
      "automationUrl": "https://seudominio.com/api/automation/xyz789secret",
      "callsGenerated": 15,
      "isActive": true,
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### **4. Obter Detalhes de uma Automação** (Privado)

```http
GET /api/automation/[automationId]
Authorization: Cookie (sessão)
```

---

### **5. Atualizar Automação** (Privado)

```http
PATCH /api/automation/[automationId]
Authorization: Cookie (sessão)
Content-Type: application/json

{
  "name": "Novo Nome",
  "isActive": false
}
```

---

### **6. Deletar Automação** (Privado)

```http
DELETE /api/automation/[automationId]
Authorization: Cookie (sessão)
```

---

## 💻 Exemplos de Uso

### **Exemplo 1: Botão em Landing Page**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Minha Landing Page</title>
</head>
<body>
  <h1>Conheça nosso Produto!</h1>
  <button onclick="gerarChamada()">Assistir Apresentação</button>

  <script>
    async function gerarChamada() {
      try {
        const response = await fetch(
          'https://seudominio.com/api/automation/xyz789secret',
          { method: 'POST' }
        );
        
        const data = await response.json();
        
        if (data.success) {
          // Redireciona para a call
          window.location.href = data.chatUrl;
        } else {
          alert('Erro ao gerar chamada: ' + data.error);
        }
      } catch (error) {
        alert('Erro ao conectar com o servidor');
      }
    }
  </script>
</body>
</html>
```

---

### **Exemplo 2: Integração com CRM**

```javascript
// Quando um lead é qualificado no CRM
async function enviarChamadaParaLead(leadEmail, leadNome) {
  // Gerar call via automação
  const response = await fetch(
    'https://seudominio.com/api/automation/xyz789secret',
    { method: 'POST' }
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Enviar email com o link
    await enviarEmail({
      to: leadEmail,
      subject: `${leadNome}, você tem uma chamada!`,
      body: `Olá ${leadNome}, clique aqui para assistir: ${data.chatUrl}`
    });
  }
}
```

---

### **Exemplo 3: Integração com WhatsApp Business API**

```javascript
// Quando recebe mensagem no WhatsApp
async function processarMensagemWhatsApp(phoneNumber, message) {
  if (message.toLowerCase().includes('quero ver')) {
    // Gerar call
    const response = await fetch(
      'https://seudominio.com/api/automation/xyz789secret',
      { method: 'POST' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Enviar link via WhatsApp
      await enviarMensagemWhatsApp(
        phoneNumber,
        `Olá! Clique aqui para assistir: ${data.chatUrl}`
      );
    }
  }
}
```

---

### **Exemplo 4: Python (Backend)**

```python
import requests

def gerar_chamada_automatica():
    url = "https://seudominio.com/api/automation/xyz789secret"
    response = requests.post(url)
    data = response.json()
    
    if data.get('success'):
        print(f"Call criada: {data['chatUrl']}")
        return data['chatUrl']
    else:
        print(f"Erro: {data.get('error')}")
        return None

# Usar em um webhook, por exemplo
@app.route('/webhook/lead-qualificado', methods=['POST'])
def webhook_lead():
    lead_data = request.json
    chat_url = gerar_chamada_automatica()
    
    if chat_url:
        enviar_email(lead_data['email'], chat_url)
    
    return {'ok': True}
```

---

## 🔐 Segurança

### **Chave Secreta (Secret)**

- Cada automação tem uma **chave secreta única**
- A chave é gerada automaticamente e **não pode ser alterada**
- **Mantenha a chave em segredo** - não exponha publicamente
- Se a chave vazar, você pode **desativar** a automação

### **Boas Práticas**

1. ✅ Use automações apenas em **requisições server-side** quando possível
2. ✅ Se usar em client-side, **proteja o código** (minificação, ofuscação)
3. ✅ **Desative automações** que não estão mais em uso
4. ✅ **Monitore** quantas calls cada automação gera
5. ✅ Use **HTTPS** em produção

---

## 📊 Estatísticas

Cada automação rastreia:
- **Calls Geradas**: Quantas calls foram criadas via essa automação
- **Status**: Ativa ou Desativada
- **Data de Criação**: Quando foi criada

Você pode ver essas estatísticas no painel `/automations`.

---

## 🔄 Reutilização

### **Características Importantes:**

1. **Link Reutilizável**: O mesmo link pode gerar **infinitas calls**
2. **Calls Únicas**: Cada POST cria uma **nova call isolada**
3. **Sem Limite**: Não há limite de calls por automação
4. **Isolamento**: Cada call é completamente independente

### **Exemplo:**

```
Link: https://seudominio.com/api/automation/xyz789secret

POST 1 → Cria call "abc-111" → Link: /ring/abc-111
POST 2 → Cria call "abc-222" → Link: /ring/abc-222
POST 3 → Cria call "abc-333" → Link: /ring/abc-333
...
```

Cada call é única e isolada!

---

## 🎯 Casos de Uso

### **1. Landing Page de Vendas**
- Cliente clica em "Assistir Apresentação"
- Sistema gera call automaticamente
- Cliente é redirecionado para a call

### **2. Email Marketing**
- Envia email com botão "Ver Apresentação"
- Ao clicar, gera call única para cada destinatário
- Rastreia quantos abriram e assistiram

### **3. Integração com CRM**
- Quando lead é qualificado, gera call automaticamente
- Envia link por email ou WhatsApp
- Rastreia conversões

### **4. Bot do Telegram**
- Usuário envia `/call` no bot
- Bot gera call via automação
- Envia link da call para o usuário

### **5. Sistema de Afiliados**
- Cada afiliado tem seu link de automação
- Rastreia vendas por afiliado
- Gera calls automaticamente para leads

---

## ⚙️ Como Funciona Internamente

### **Quando você faz POST em `/api/automation/[secret]`:**

1. **Validação**: Sistema verifica se o `secret` existe e está ativo
2. **Busca Automação**: Encontra os dados da automação (vídeo, título, etc.)
3. **Cria Call**: Gera um novo `callId` único
4. **Copia Dados**: Copia vídeo, título, avatar da automação para a call
5. **Registra Evento**: Salva que uma call foi criada via automação
6. **Registra Venda**: Se houver `expectedAmount`, registra como venda
7. **Retorna Link**: Retorna o link da call criada

### **Código Interno (simplificado):**

```javascript
app.post('/api/automation/:secret', (req, res) => {
  // 1. Buscar automação pelo secret
  const automation = findAutomationBySecret(secret);
  
  // 2. Validar se existe e está ativa
  if (!automation || !automation.isActive) {
    return res.status(404).json({ error: 'Invalid automation' });
  }
  
  // 3. Criar nova call com dados da automação
  const callId = generateUniqueId();
  const call = {
    videoUrl: automation.videoUrl,
    title: automation.title,
    callerName: automation.callerName,
    callerAvatarUrl: automation.callerAvatarUrl,
    expectedAmount: automation.expectedAmount,
    automationId: automation.id
  };
  
  // 4. Salvar call
  saveCall(callId, call);
  
  // 5. Registrar evento e venda
  logEvent('automation_call_created', callId);
  if (automation.expectedAmount) {
    registerSale(callId, automation.expectedAmount);
  }
  
  // 6. Retornar link
  res.json({
    success: true,
    chatUrl: `${baseUrl}/ring/${callId}`,
    chatId: callId
  });
});
```

---

## ✅ Vantagens

1. **Escalável**: Gere milhares de calls sem intervenção manual
2. **Reutilizável**: Um link serve para infinitos clientes
3. **Rastreável**: Veja quantas calls cada automação gerou
4. **Flexível**: Use em qualquer sistema (web, mobile, bot, etc.)
5. **Simples**: Apenas um POST e você tem uma call

---

## 🚀 Resumo

**API de Automações = Links Reutilizáveis que Geram Calls Automaticamente**

1. Crie uma automação no painel
2. Receba um link privado
3. Use o link em qualquer lugar (landing page, email, bot, etc.)
4. Cada POST no link cria uma nova call única
5. Cliente acessa a call e assiste ao vídeo

**É simples, poderoso e escalável!** 🎯


