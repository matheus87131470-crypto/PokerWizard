# Script para usar LocalTunnel (sem download, só npm)
# Execute: .\start-with-localtunnel.ps1

Write-Host "🌐 Iniciando PokerWizard com LocalTunnel" -ForegroundColor Cyan
Write-Host ""

# Verificar se LocalTunnel está instalado
Write-Host "📦 Verificando LocalTunnel..." -ForegroundColor Yellow
$ltInstalled = Get-Command lt -ErrorAction SilentlyContinue

if (-not $ltInstalled) {
    Write-Host "❌ LocalTunnel não encontrado. Instalando..." -ForegroundColor Red
    npm install -g localtunnel
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ LocalTunnel instalado!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao instalar LocalTunnel" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ LocalTunnel já instalado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Cyan

# Mata processos node anteriores
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Inicia servidor em background job
$serverJob = Start-Job -ScriptBlock {
    Set-Location "c:\Users\Markim\Downloads\PokerWizard_PRO_Complete\server"
    npm run dev
}

Write-Host "⏳ Aguardando servidor inicializar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🌐 Criando túnel público..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ URL PÚBLICA GERADA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Copie a URL mostrada abaixo:" -ForegroundColor White
Write-Host "   Exemplo: https://random-name.loca.lt" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Use essa URL para acessar de qualquer lugar!" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Ao abrir a URL pela primeira vez, clique em 'Click to Continue'" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "⏹️  Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

try {
    # Inicia LocalTunnel
    npx localtunnel --port 3000
}
finally {
    # Cleanup
    Write-Host ""
    Write-Host "🛑 Encerrando servidor..." -ForegroundColor Yellow
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -Force -ErrorAction SilentlyContinue
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Servidor encerrado!" -ForegroundColor Green
}
