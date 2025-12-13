# Script para fazer build de produção conectado ao Render
# Execute: .\build-for-render.ps1

Write-Host "🏗️  Build do PokerWizard para Produção (Render)" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Backend API: https://pokerwizard.onrender.com" -ForegroundColor White
Write-Host "   Ambiente: Produção" -ForegroundColor White
Write-Host ""

# Vai para pasta do frontend
Set-Location "$PSScriptRoot\client"

# Cria .env.local para produção
Write-Host "Configurando variaveis de ambiente..." -ForegroundColor Yellow
$envContent = "VITE_API_BASE=https://pokerwizard.onrender.com"
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "Variaveis configuradas!" -ForegroundColor Green
Write-Host ""

# Instala dependências se necessário
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
    Write-Host ""
}

# Build
Write-Host "🔨 Fazendo build de produção..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "BUILD CONCLUIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Arquivos gerados em: client\dist\" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "OPÇÃO 1: Deploy no Vercel" -ForegroundColor Yellow
    Write-Host "   cd client" -ForegroundColor Gray
    Write-Host "   vercel --prod" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPÇÃO 2: Deploy no Netlify" -ForegroundColor Yellow
    Write-Host "   npm install -g netlify-cli" -ForegroundColor Gray
    Write-Host "   cd client" -ForegroundColor Gray
    Write-Host "   netlify deploy --prod --dir=dist" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPÇÃO 3: Deploy no Render Static Site" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://render.com" -ForegroundColor Gray
    Write-Host "   2. New > Static Site" -ForegroundColor Gray
    Write-Host "   3. Build: cd client && npm install && npm run build" -ForegroundColor Gray
    Write-Host "   4. Publish: client/dist" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPÇÃO 4: Testar localmente (conectado ao Render)" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host "   Acesse: http://localhost:5173" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    Write-Host "Verifique os erros acima e tente novamente." -ForegroundColor Yellow
    Write-Host ""
}

# Volta para pasta raiz
Set-Location $PSScriptRoot
