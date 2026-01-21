# 🔧 Como Corrigir a Porta no Railway

## ❌ Problema

O Railway está passando `PORT=8080` como variável de ambiente, fazendo a aplicação rodar na porta errada.

## ✅ Solução 1: Remover/Corrigir Variável de Ambiente no Railway

### Passos:

1. **Acesse o Railway Dashboard**
   - Vá para o projeto `chamada-quente-1.2`
   - Clique em **"Variáveis"** (Variables)

2. **Verifique se existe `PORT=8080`**
   - Se existir, **DELETE** essa variável
   - O Railway vai usar a porta que você configurou nas "Configurações" → "Domínios"

3. **Configure a Porta de Destino**
   - Vá em **"Configurações"** → **"Domínios"**
   - Certifique-se de que a **porta de destino** está como `3000`
   - Não a porta externa (8080), mas a porta interna onde a aplicação escuta

## ✅ Solução 2: Código Forçando Porta 3000

O código foi atualizado para **forçar porta 3000** mesmo se o Railway passar PORT=8080:

```javascript
// Força porta 3000 se Railway passar 8080
const FINAL_PORT = PORT === 8080 ? 3000 : PORT;
```

## 🚀 Próximos Passos

1. **Fazer commit e push**:
   ```bash
   git add server.js
   git commit -m "fix: Força porta 3000 mesmo se Railway passar PORT=8080"
   git push origin main
   ```

2. **No Railway - Remover variável PORT (se existir)**:
   - Vá em **"Variáveis"** (Variables)
   - Procure por `PORT`
   - Se o valor for `8080`, **DELETE** a variável
   - Ou altere para `3000`

3. **Verificar Configuração de Porta**:
   - Vá em **"Configurações"** → **"Domínios"**
   - Confirme que a porta de destino está como `3000`

4. **Aguardar novo deploy**:
   - O Railway vai fazer deploy automaticamente
   - Verifique os logs: deve mostrar `🚀 Rodando na porta 3000`

## 📋 Checklist

- [ ] Código atualizado para forçar porta 3000
- [ ] Commit e push feito
- [ ] Variável `PORT=8080` removida do Railway (se existir)
- [ ] Porta de destino configurada como `3000` no Railway
- [ ] Novo deploy realizado
- [ ] Logs mostram `🚀 Rodando na porta 3000`

## 🔍 Como Verificar

Após o deploy, nos logs do Railway você deve ver:
```
🚀 Rodando na porta 3000 (host: 0.0.0.0)
```

Se ainda aparecer `8080`, significa que:
1. O código não foi atualizado (verifique se fez push)
2. Ou há uma variável `PORT=8080` no Railway que precisa ser removida


