# Script para testar frontend local conectado ao backend no Render
# Execute: .\test-with-render.ps1

Write-Host "Testando PokerWizard Local com Backend no Render" -ForegroundColor Cyan
Write-Host ""

Write-Host "Configuracoes:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:5173 (local)" -ForegroundColor White
Write-Host "   Backend:  https://pokerwizard.onrender.com (Render)" -ForegroundColor White
Write-Host ""

# Vai para pasta do frontend
Set-Location "$PSScriptRoot\client"

# Cria .env.local temporario
Write-Host "Configurando para usar backend do Render..." -ForegroundColor Yellow
"VITE_API_BASE=https://pokerwizard.onrender.com" | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "Configurado!" -ForegroundColor Green
Write-Host ""

# Verifica dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host "Dependencias instaladas!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Green
Write-Host "INICIANDO SERVIDOR DE DESENVOLVIMENTO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend local: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend remoto: https://pokerwizard.onrender.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Teste todas as funcionalidades:" -ForegroundColor Yellow
Write-Host "   - Login/Registro" -ForegroundColor White
Write-Host "   - Recuperacao de senha" -ForegroundColor White
Write-Host "   - Pagamento PIX" -ForegroundColor White
Write-Host "   - Training Lab" -ForegroundColor White
Write-Host "   - GTO Solutions" -ForegroundColor White
Write-Host ""
Write-Host "AVISO: Primeiro acesso ao Render pode demorar ~30s" -ForegroundColor Yellow
Write-Host "(servidor esta acordando do modo sleep)" -ForegroundColor Gray
Write-Host ""
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Red
Write-Host ""

npm run dev

# Volta para pasta raiz
Set-Location $PSScriptRoot
