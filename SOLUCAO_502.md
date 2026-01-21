# 🔧 Solução para Erro 502 (Bad Gateway)

## ❌ Problema

Após mudar a porta para 3000, você recebeu o erro:
```
Failed to load resource: the server responded with a status of 502
```

## 🔍 Causa

O erro 502 (Bad Gateway) acontece quando:
1. O Railway tenta se conectar à aplicação
2. Mas a aplicação não está escutando na interface correta
3. Por padrão, Node.js escuta apenas em `localhost` (127.0.0.1)
4. No Railway, precisa escutar em `0.0.0.0` (todas as interfaces)

## ✅ Solução Aplicada

Alterado o `server.listen()` para escutar explicitamente em `0.0.0.0`:

```javascript
// ANTES
server.listen(PORT, () => console.log(`🚀 Rodando na porta ${PORT}`));

// DEPOIS
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 Rodando na porta ${PORT} (host: ${HOST})`);
});
```

## 🚀 O que isso faz

- **Localmente**: Escuta em `0.0.0.0:3000` (acessível via localhost)
- **No Railway**: Escuta em `0.0.0.0` na porta definida pelo Railway
- **Resultado**: O Railway consegue se conectar à aplicação

## 📋 Configuração no Railway

No Railway, você já configurou:
- **Porta de destino**: `3000` ✅
- A aplicação agora escuta em `0.0.0.0:3000` ✅

## 🔄 Próximos Passos

1. **Fazer commit e push**:
   ```bash
   git add server.js
   git commit -m "fix: Configura servidor para escutar em 0.0.0.0 para corrigir erro 502 no Railway"
   git push origin main
   ```

2. **Aguardar deploy no Railway**:
   - O Railway vai fazer deploy automaticamente
   - Verifique os logs para confirmar: `🚀 Rodando na porta X (host: 0.0.0.0)`

3. **Testar**:
   - Acesse o domínio do Railway
   - O erro 502 deve desaparecer

## 🐛 Se ainda der erro

1. **Verifique os logs do Railway**:
   - Vá em "Registros" (Logs) no Railway
   - Procure por erros de inicialização

2. **Verifique a porta no Railway**:
   - Vá em "Configurações" → "Domínios"
   - Confirme que a porta de destino está como `3000`

3. **Verifique variáveis de ambiente**:
   - Certifique-se de que `NODE_ENV=production` está configurado

## ✅ Status

- ✅ Servidor configurado para escutar em `0.0.0.0`
- ✅ Porta configurada para `3000` (ou `PORT` do Railway)
- ✅ Pronto para deploy


