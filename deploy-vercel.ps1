# Script de deploy automático para Vercel
# Execute: .\deploy-vercel.ps1

Write-Host "🚀 Deploy PokerWizard no Vercel" -ForegroundColor Cyan
Write-Host ""

# Verifica se Vercel CLI está instalado
Write-Host "📦 Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI não encontrado. Instalando..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI instalado!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI já instalado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📁 Preparando projeto..." -ForegroundColor Yellow

# Vai para pasta do frontend
Set-Location -Path "$PSScriptRoot\client"

# Verifica se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Fazendo build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build. Verifique os erros acima." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Iniciando deploy no Vercel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "- Se for a primeira vez, você precisará fazer login" -ForegroundColor White
Write-Host "- Escolha o escopo da sua conta" -ForegroundColor White
Write-Host "- Nome do projeto: pokerwizard" -ForegroundColor White
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Copie a URL gerada acima" -ForegroundColor White
    Write-Host "2. Configure variáveis de ambiente no Vercel Dashboard:" -ForegroundColor White
    Write-Host "   - VITE_API_URL (URL do backend)" -ForegroundColor White
    Write-Host "3. Acesse https://vercel.com/dashboard para gerenciar" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy. Verifique os erros acima." -ForegroundColor Red
    Write-Host "💡 Dica: Execute 'vercel login' primeiro se não estiver autenticado" -ForegroundColor Yellow
}

# Volta para pasta raiz
Set-Location -Path $PSScriptRoot
