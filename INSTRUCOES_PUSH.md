# 📤 Instruções para Fazer Push para o Repositório callhot-copia

## 🎯 Objetivo
Subir os arquivos da pasta **"Callhot - Copia"** (com as novas funcionalidades) para o repositório GitHub **callhot-copia**.

## ✅ Pré-requisitos

1. **Git instalado** - Se não tiver, baixe em: https://git-scm.com/download/win
2. **Repositório criado no GitHub** - Crie o repositório `callhot-copia` em: https://github.com/new
   - Nome: `callhot-copia`
   - Visibilidade: Público ou Privado (sua escolha)
   - **NÃO** inicialize com README, .gitignore ou licença (já temos esses arquivos)

## 🚀 Método 1: Usando o Script PowerShell (Recomendado)

1. Abra o PowerShell na pasta `Callhot - Copia`
2. Execute o script:
   ```powershell
   .\push-to-github.ps1
   ```
3. Siga as instruções na tela

## 🚀 Método 2: Comandos Manuais

Se preferir fazer manualmente ou o script não funcionar:

### 1. Abrir PowerShell na pasta "Callhot - Copia"
```powershell
cd "C:\Users\kauan\Downloads\Callhot\Callhot - Copia"
```

### 2. Inicializar Git (se ainda não foi feito)
```powershell
git init
```

### 3. Adicionar todos os arquivos
```powershell
git add .
```

### 4. Fazer commit
```powershell
git commit -m "feat: Adiciona sistema de automações e integração com Telegram Bot

- Sistema de automações reutilizáveis com links privados
- API pública para gerar calls via automação
- Integração completa com Telegram Bot
- Configuração de fluxo de mensagens personalizável
- Botões interativos para seleção de preços e horários
- Página de documentação da API
- Estatísticas de calls geradas por automação"
```

### 5. Configurar o remote
```powershell
git remote add origin https://github.com/kauan123749578/callhot-copia.git
```

Se já existir um remote, atualize:
```powershell
git remote set-url origin https://github.com/kauan123749578/callhot-copia.git
```

### 6. Fazer push
```powershell
git push -u origin main
```

Se der erro de branch, tente:
```powershell
git branch -M main
git push -u origin main
```

## 🔐 Autenticação

Se pedir usuário e senha:
- **Usuário**: Seu username do GitHub
- **Senha**: Use um **Personal Access Token** (não sua senha normal)
  - Crie um token em: https://github.com/settings/tokens
  - Permissões: `repo` (acesso completo aos repositórios)

## 📋 Arquivos que Serão Enviados

✅ **Serão enviados:**
- Todo o código fonte (app/, components/, lib/, etc.)
- Arquivos de configuração (package.json, tsconfig.json, etc.)
- README.md e documentação
- .gitignore

❌ **NÃO serão enviados** (devido ao .gitignore):
- `node_modules/` - Dependências (instale com `npm install`)
- `data/*.json` - Dados sensíveis (criados automaticamente)
- `public/uploads/` - Vídeos e arquivos enviados
- `.env` - Variáveis de ambiente

## 🆘 Problemas Comuns

### Erro: "repository not found"
- Certifique-se de que o repositório `callhot-copia` foi criado no GitHub
- Verifique se você tem permissão para fazer push

### Erro: "authentication failed"
- Use um Personal Access Token em vez da senha
- Ou configure SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Erro: "branch main does not exist"
```powershell
git branch -M main
git push -u origin main
```

## ✅ Verificação

Após o push, verifique em:
https://github.com/kauan123749578/callhot-copia

Todos os arquivos devem estar lá!


