# Script para iniciar servidor com Ngrok (URL pública)
# Execute: .\start-with-ngrok.ps1

Write-Host "🌐 Iniciando PokerWizard com URL Pública (Ngrok)" -ForegroundColor Cyan
Write-Host ""

# Verificar se ngrok está instalado
$ngrokPath = ".\ngrok.exe"
$ngrokExists = Test-Path $ngrokPath

if (-not $ngrokExists) {
    Write-Host "📥 Ngrok não encontrado. Baixando..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, siga estes passos:" -ForegroundColor White
    Write-Host "1. Acesse: https://ngrok.com/download" -ForegroundColor Cyan
    Write-Host "2. Baixe a versão para Windows" -ForegroundColor Cyan
    Write-Host "3. Extraia o ngrok.exe para esta pasta:" -ForegroundColor Cyan
    Write-Host "   $PSScriptRoot" -ForegroundColor Yellow
    Write-Host ""
    
    $openBrowser = Read-Host "Abrir página de download do Ngrok? (s/n)"
    if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
        Start-Process "https://ngrok.com/download"
    }
    
    Write-Host ""
    Write-Host "Após baixar e extrair, execute este script novamente!" -ForegroundColor Green
    Write-Host ""
    
    # Alternativa: LocalTunnel
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "💡 ALTERNATIVA: LocalTunnel (sem download necessário)" -ForegroundColor Yellow
    Write-Host ""
    $useLocalTunnel = Read-Host "Deseja usar LocalTunnel ao invés? (s/n)"
    
    if ($useLocalTunnel -eq "s" -or $useLocalTunnel -eq "S") {
        Write-Host ""
        Write-Host "📦 Instalando LocalTunnel..." -ForegroundColor Yellow
        npm install -g localtunnel
        
        Write-Host ""
        Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Cyan
        
        # Inicia servidor em background
        $serverJob = Start-Job -ScriptBlock {
            Set-Location "c:\Users\Markim\Downloads\PokerWizard_PRO_Complete\server"
            npm run dev
        }
        
        Write-Host "⏳ Aguardando servidor inicializar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        Write-Host "🌐 Criando túnel público..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "✅ URL PÚBLICA GERADA!" -ForegroundColor Green
        Write-Host "Acesse a URL mostrada abaixo:" -ForegroundColor White
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        
        npx localtunnel --port 3000
        
        # Cleanup
        Stop-Job $serverJob
        Remove-Job $serverJob
    }
    
    exit
}

Write-Host "✅ Ngrok encontrado!" -ForegroundColor Green
Write-Host ""

# Verificar se já tem conta ngrok (authtoken)
Write-Host "📋 CONFIGURAÇÃO INICIAL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para usar ngrok, você precisa de uma conta grátis:" -ForegroundColor White
Write-Host "1. Crie conta em: https://dashboard.ngrok.com/signup" -ForegroundColor Cyan
Write-Host "2. Copie seu authtoken em: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Cyan
Write-Host "3. Configure com: .\ngrok.exe authtoken SEU-TOKEN-AQUI" -ForegroundColor Cyan
Write-Host ""

$configured = Read-Host "Já configurou o authtoken? (s/n)"

if ($configured -ne "s" -and $configured -ne "S") {
    Write-Host ""
    $openSignup = Read-Host "Abrir página de registro do Ngrok? (s/n)"
    if ($openSignup -eq "s" -or $openSignup -eq "S") {
        Start-Process "https://dashboard.ngrok.com/signup"
    }
    
    Write-Host ""
    Write-Host "Após criar conta e copiar o authtoken, execute:" -ForegroundColor Yellow
    Write-Host ".\ngrok.exe config add-authtoken SEU-TOKEN-AQUI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Depois execute este script novamente!" -ForegroundColor Green
    exit
}

Write-Host ""
Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Cyan

# Mata processos node anteriores
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Inicia servidor em nova janela
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm run dev" -PassThru

Write-Host "⏳ Aguardando servidor inicializar (5 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🌐 Criando túnel público com Ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ SERVIDOR INICIADO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Copie a URL gerada abaixo (linha 'Forwarding'):" -ForegroundColor White
Write-Host "   Exemplo: https://abc123.ngrok.io -> http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Use essa URL para acessar de qualquer lugar!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Pressione Ctrl+C para parar o túnel" -ForegroundColor Yellow
Write-Host ""

# Inicia ngrok
& $ngrokPath http 3000

# Cleanup quando ngrok for fechado
Write-Host ""
Write-Host "🛑 Encerrando servidor..." -ForegroundColor Yellow
Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "✅ Servidor encerrado!" -ForegroundColor Green
