# Instruções para Fazer Commit e Push

## Novas Funcionalidades Adicionadas

### ✅ Sistema de Automações
- Criação de automações reutilizáveis
- Links privados que geram calls automaticamente
- API pública `/api/automation/[secret]`
- Estatísticas de calls geradas

### ✅ Integração com Telegram Bot
- Configuração de bot via BotFather
- Fluxo de mensagens personalizável
- Botões interativos
- Seleção de preços e horários
- Comando `/call` para gerar chamadas

### ✅ Documentação da API
- Página de documentação em `/api-docs`
- Exemplos de uso (JavaScript, Python, cURL)
- Guia completo de integração

## Comandos Git

Se você tem Git instalado, execute os seguintes comandos no terminal:

```bash
# 1. Verificar status
git status

# 2. Adicionar todos os arquivos modificados
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "feat: Adiciona sistema de automações e integração com Telegram Bot

- Sistema de automações reutilizáveis com links privados
- API pública para gerar calls via automação
- Integração completa com Telegram Bot
- Configuração de fluxo de mensagens personalizável
- Botões interativos para seleção de preços e horários
- Página de documentação da API
- Estatísticas de calls geradas por automação"

# 4. Verificar se o remote está configurado
git remote -v

# 5. Se não estiver configurado, adicionar o remote
git remote add origin https://github.com/kauan123749578/callhot-copia.git

# 6. Fazer push para o repositório
git push -u origin main
```

## Arquivos Modificados/Criados

### Novos Arquivos:
- `app/automations/page.tsx` - Interface de gerenciamento de automações
- `app/api-docs/page.tsx` - Documentação da API
- `data/automations.json` - Armazenamento de automações (criado automaticamente)
- `data/telegram-bots.json` - Configurações de bots (criado automaticamente)

### Arquivos Modificados:
- `server.js` - Sistema de automações e Telegram Bot
- `components/AppShell.tsx` - Adicionado link para Automações e API Docs
- `package.json` - Adicionada dependência `node-telegram-bot-api`

## Se Git não estiver instalado

1. Instale o Git: https://git-scm.com/download/win
2. Ou use o GitHub Desktop: https://desktop.github.com/
3. Ou faça upload manual via interface web do GitHub

## Nota Importante

Certifique-se de que o arquivo `.gitignore` está configurado para não commitar:
- `node_modules/`
- `data/*.json` (dados sensíveis)
- `.env` (variáveis de ambiente)

