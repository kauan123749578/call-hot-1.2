# 🔧 Como Corrigir a Conexão do Banco de Dados

## Problema
A variável `URL_DO_BANCO_DE_DADOS` no serviço "chamada-quente-1.2" está apontando para o banco errado.

## Solução Rápida

### Opção 1: Copiar URL Manualmente (Mais Simples)

1. **No serviço "Postgres-gKGD"** (o banco que você criou):
   - Vá em **"Variables"**
   - Encontre a variável `URL_DO_BANCO_DE_DADOS`
   - **Copie o valor completo** (deve terminar com `@postgres-gkgd.railway.internal:5432/railway`)

2. **No serviço "chamada-quente-1.2"** (seu app):
   - Vá em **"Variables"**
   - Encontre a variável `URL_DO_BANCO_DE_DADOS`
   - Clique no **ícone de edição** (lápis) ou nos **três pontinhos** → **"Edit"**
   - **Cole a URL correta** que você copiou
   - Clique em **"Save"** ou **"Salvar"**

### Opção 2: Usar Variável Compartilhada (Recomendado)

1. **No serviço "chamada-quente-1.2"**, vá em **"Variables"**
2. Clique em **"Variável compartilhada"** ou **"Shared Variable"**
3. Selecione o serviço **"Postgres-gKGD"**
4. Selecione a variável **`URL_DO_BANCO_DE_DADOS`**
5. Isso criará uma referência automática que sempre aponta para o banco correto

### Opção 3: Deletar e Recriar

1. **No serviço "chamada-quente-1.2"**, vá em **"Variables"**
2. Encontre `URL_DO_BANCO_DE_DADOS`
3. Clique nos **três pontinhos** → **"Delete"** ou **"Excluir"**
4. Clique em **"+ Nova variável"** ou **"+ New Variable"**
5. **Nome:** `URL_DO_BANCO_DE_DADOS`
6. **Valor:** Copie do serviço "Postgres-gKGD" (passo 1 da Opção 1)
7. Salve

## Como Verificar se Está Correto

A URL correta deve ter:
- ✅ `postgres-gkgd.railway.internal` (não `postgres.railway.internal`)
- ✅ Ou o nome do seu serviço PostgreSQL específico

A URL errada tem:
- ❌ `postgres.railway.internal` (genérico, pode ser de outro projeto)

## Após Corrigir

1. O Railway fará **redeploy automático** ou você pode forçar:
   - Vá em **"Deployments"**
   - Clique em **"Redeploy"** no deploy mais recente

2. Verifique os **logs** - deve aparecer:
   ```
   ✅ Conectado ao PostgreSQL
   ✅ Banco de dados PostgreSQL inicializado
   ```

3. Teste criar um usuário novamente - deve funcionar!

## Dica

Se você usar a **Opção 2 (Variável Compartilhada)**, o Railway automaticamente mantém a referência atualizada. Se o banco mudar, não precisa atualizar manualmente! 🎉



