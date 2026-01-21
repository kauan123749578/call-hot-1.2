# 🔌 Configuração de Portas

## 📋 Situação Atual

- **Projeto 1 (call-hot)**: Rodando na porta **8080** no Railway
- **Projeto 2 (callhot-copia)**: Agora configurado para porta **3000** (local) e **PORT do Railway** (produção)

## 🔧 Configuração

### Desenvolvimento Local

O projeto 2 agora usa a porta **3000** por padrão:

```bash
npm start
# Servidor iniciará em http://localhost:3000
```

### Railway (Produção)

No Railway, a porta é definida automaticamente pela variável de ambiente `PORT` que o Railway fornece. O código já está configurado para usar:

```javascript
const PORT = process.env.PORT || 3000;
```

Isso significa:
- **No Railway**: Usa `process.env.PORT` (porta definida pelo Railway)
- **Localmente**: Usa `3000` como fallback

## ✅ O que foi alterado

1. ✅ `server.js` - Porta padrão mudada de `8080` para `3000`
2. ✅ `server.js` - `baseUrl` localhost mudado de `8080` para `3000`
3. ✅ `README.md` - Documentação atualizada com porta `3000`

## 🚀 Deploy no Railway

### Configuração Automática

O Railway detecta automaticamente a porta através da variável `PORT`. Não é necessário configurar nada manualmente.

### Se precisar definir manualmente

1. No Railway, vá em **Settings** → **Environment Variables**
2. Adicione (se necessário):
   - `PORT`: Deixe o Railway definir automaticamente (não precisa adicionar)
   - `NODE_ENV`: `production`

## 📝 Notas Importantes

- ✅ O projeto 1 continua na porta 8080
- ✅ O projeto 2 usa porta 3000 localmente
- ✅ No Railway, ambos usam portas diferentes automaticamente
- ✅ Não há conflito entre os projetos

## 🔍 Verificação

Para verificar qual porta está sendo usada:

```bash
# Localmente
npm start
# Deve mostrar: 🚀 Rodando na porta 3000

# No Railway
# Verifique os logs do serviço
# Deve mostrar a porta definida pelo Railway
```


