# Deploy Frontend no Vercel - PokerWizard

Write-Host "Preparando deploy do frontend no Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verifica se Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "Vercel CLI nao encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host ""
}

# Vai para pasta do cliente
Set-Location "$PSScriptRoot\client"

Write-Host "Configuracoes:" -ForegroundColor Yellow
Write-Host "   Backend API: https://pokerwizard.onrender.com" -ForegroundColor White
Write-Host "   Framework: Vite + React" -ForegroundColor White
Write-Host "   Variaveis de ambiente: .env.production" -ForegroundColor White
Write-Host ""

Write-Host "Iniciando deploy no Vercel..." -ForegroundColor Green
Write-Host ""

# Deploy no Vercel
vercel --prod

Write-Host ""
Write-Host "Deploy concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Copie a URL do Vercel que apareceu acima" -ForegroundColor White
Write-Host "2. Teste todas as funcionalidades" -ForegroundColor White
Write-Host "3. Configure dominio customizado (opcional)" -ForegroundColor White

# Volta para pasta raiz
Set-Location $PSScriptRoot
