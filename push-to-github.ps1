# Script para fazer push do projeto para o repositório call-hot-1.2
# Execute este script na pasta "Callhot - Copia"

Write-Host "🚀 Preparando para fazer push para o repositório call-hot-1.2..." -ForegroundColor Green

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "Por favor, instale o Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Verificar se já existe um repositório Git
if (Test-Path .git) {
    Write-Host "✅ Repositório Git já existe" -ForegroundColor Green
} else {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repositório inicializado" -ForegroundColor Green
}

# Verificar remote
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote já configurado: $remoteUrl" -ForegroundColor Green
    
    # Verificar se precisa atualizar
    if ($remoteUrl -notlike "*call-hot-1.2*") {
        Write-Host "🔄 Atualizando remote para call-hot-1.2..." -ForegroundColor Yellow
        git remote set-url origin https://github.com/kauan123749578/call-hot-1.2.git
        Write-Host "✅ Remote atualizado" -ForegroundColor Green
    }
} else {
    Write-Host "📡 Configurando remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/kauan123749578/call-hot-1.2.git
    Write-Host "✅ Remote configurado" -ForegroundColor Green
}

# Adicionar arquivos
Write-Host "📝 Adicionando arquivos..." -ForegroundColor Yellow
git add .

# Verificar se há mudanças para commitar
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Fazendo commit..." -ForegroundColor Yellow
    git commit -m "feat: Melhora tela de atendimento e adiciona chat durante chamada

- Tela de atendimento mais realista com animações e efeitos visuais
- Página intermediária de 'conectando' após clicar em Atender
- Botão de chat na interface de vídeo durante a chamada
- Funcionalidade completa de chat com mensagens em tempo real
- Interface de chat moderna e responsiva"
    Write-Host "✅ Commit realizado" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Nenhuma mudança para commitar" -ForegroundColor Cyan
}

# Fazer push
Write-Host "⬆️  Fazendo push para o GitHub..." -ForegroundColor Yellow
Write-Host "⚠️  Certifique-se de que o repositório 'call-hot-1.2' já existe no GitHub!" -ForegroundColor Yellow
Write-Host ""

# Tentar push para main
git push -u origin main 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Repositório: https://github.com/kauan123749578/call-hot-1.2" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "⚠️  Erro ao fazer push. Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   1. O repositório 'call-hot-1.2' não existe no GitHub" -ForegroundColor Yellow
    Write-Host "   2. Você não tem permissão para fazer push" -ForegroundColor Yellow
    Write-Host "   3. Precisa fazer autenticação (token ou SSH)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Dica: Crie o repositório 'call-hot-1.2' no GitHub primeiro:" -ForegroundColor Cyan
    Write-Host "   https://github.com/new" -ForegroundColor Cyan
}


