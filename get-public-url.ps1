# Menu Interativo - Escolha Como Ter URL Pública
# Execute: .\get-public-url.ps1

function Show-Menu {
    Clear-Host
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "    🌐 POKERWIZARD - URL PÚBLICA            " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Escolha como deseja ter uma URL pública:" -ForegroundColor White
    Write-Host ""
    Write-Host "1️⃣  LocalTunnel" -ForegroundColor Green
    Write-Host "   ✅ Mais fácil (só precisa de npm)" -ForegroundColor Gray
    Write-Host "   ✅ Sem download necessário" -ForegroundColor Gray
    Write-Host "   ✅ Funciona em 1 minuto" -ForegroundColor Gray
    Write-Host "   ⚠️  URL muda cada vez" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2️⃣  Ngrok" -ForegroundColor Green
    Write-Host "   ✅ Mais popular" -ForegroundColor Gray
    Write-Host "   ✅ Melhor performance" -ForegroundColor Gray
    Write-Host "   ⚠️  Precisa criar conta grátis" -ForegroundColor Yellow
    Write-Host "   ⚠️  Precisa baixar (2MB)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3️⃣  Render.com (Deploy Real)" -ForegroundColor Green
    Write-Host "   ✅ URL permanente" -ForegroundColor Gray
    Write-Host "   ✅ Grátis para sempre" -ForegroundColor Gray
    Write-Host "   ✅ HTTPS automático" -ForegroundColor Gray
    Write-Host "   ⚠️  Leva 5 minutos para configurar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4️⃣  Railway.app" -ForegroundColor Green
    Write-Host "   ✅ Mais moderno" -ForegroundColor Gray
    Write-Host "   ✅ $5 crédito grátis" -ForegroundColor Gray
    Write-Host "   ✅ Deploy automático" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5️⃣  Ver guia completo (ALTERNATIVAS_URL.md)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "0️⃣  Sair" -ForegroundColor Red
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Start-LocalTunnel {
    Write-Host ""
    Write-Host "🚀 Iniciando com LocalTunnel..." -ForegroundColor Cyan
    Write-Host ""
    & "$PSScriptRoot\start-with-localtunnel.ps1"
}

function Start-Ngrok {
    Write-Host ""
    Write-Host "🚀 Iniciando com Ngrok..." -ForegroundColor Cyan
    Write-Host ""
    & "$PSScriptRoot\start-with-ngrok.ps1"
}

function Show-RenderGuide {
    Clear-Host
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "    📦 DEPLOY NO RENDER.COM                 " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Passo a passo:" -ForegroundColor White
    Write-Host ""
    Write-Host "1️⃣  Acesse: https://render.com" -ForegroundColor Green
    Write-Host "   Clique em 'Get Started for Free'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2️⃣  Crie conta (GitHub, GitLab ou Email)" -ForegroundColor Green
    Write-Host ""
    Write-Host "3️⃣  New + > Web Service" -ForegroundColor Green
    Write-Host ""
    Write-Host "4️⃣  Configure:" -ForegroundColor Green
    Write-Host "   Nome: pokerwizard" -ForegroundColor Gray
    Write-Host "   Environment: Node" -ForegroundColor Gray
    Write-Host "   Build Command: cd server && npm install" -ForegroundColor Gray
    Write-Host "   Start Command: cd server && npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5️⃣  Environment Variables:" -ForegroundColor Green
    Write-Host "   NODE_ENV=production" -ForegroundColor Gray
    Write-Host "   PORT=3000" -ForegroundColor Gray
    Write-Host "   JWT_SECRET=seu-secret-aqui" -ForegroundColor Gray
    Write-Host ""
    Write-Host "6️⃣  Create Web Service" -ForegroundColor Green
    Write-Host ""
    Write-Host "7️⃣  Aguarde deploy (~5 minutos)" -ForegroundColor Green
    Write-Host ""
    Write-Host "8️⃣  URL final: https://pokerwizard.onrender.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $openRender = Read-Host "Abrir Render.com agora? (s/n)"
    if ($openRender -eq "s" -or $openRender -eq "S") {
        Start-Process "https://render.com"
    }
    
    Write-Host ""
    Read-Host "Pressione Enter para voltar ao menu"
}

function Show-RailwayGuide {
    Clear-Host
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "    🚂 DEPLOY NO RAILWAY.APP                " -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Método 1: Via CLI (Mais Rápido)" -ForegroundColor White
    Write-Host ""
    Write-Host "1️⃣  Instale Railway CLI:" -ForegroundColor Green
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2️⃣  Faça login:" -ForegroundColor Green
    Write-Host "   railway login" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3️⃣  Inicialize:" -ForegroundColor Green
    Write-Host "   railway init" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4️⃣  Deploy:" -ForegroundColor Green
    Write-Host "   railway up" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5️⃣  Abra:" -ForegroundColor Green
    Write-Host "   railway open" -ForegroundColor Gray
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Método 2: Via Interface Web" -ForegroundColor White
    Write-Host ""
    Write-Host "1️⃣  Acesse: https://railway.app" -ForegroundColor Green
    Write-Host "2️⃣  Login com GitHub" -ForegroundColor Green
    Write-Host "3️⃣  New Project > Deploy from GitHub" -ForegroundColor Green
    Write-Host "4️⃣  Selecione seu repositório" -ForegroundColor Green
    Write-Host "5️⃣  Deploy automático!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $install = Read-Host "Instalar Railway CLI agora? (s/n)"
    if ($install -eq "s" -or $install -eq "S") {
        Write-Host ""
        Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Railway CLI instalado!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Execute: railway login" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Read-Host "Pressione Enter para voltar ao menu"
}

# Loop principal
do {
    Show-Menu
    $choice = Read-Host "Digite sua escolha (0-5)"
    
    switch ($choice) {
        "1" {
            Start-LocalTunnel
            Read-Host "Pressione Enter para voltar ao menu"
        }
        "2" {
            Start-Ngrok
            Read-Host "Pressione Enter para voltar ao menu"
        }
        "3" {
            Show-RenderGuide
        }
        "4" {
            Show-RailwayGuide
        }
        "5" {
            Write-Host ""
            Write-Host "📖 Abrindo guia completo..." -ForegroundColor Cyan
            Start-Process "ALTERNATIVAS_URL.md"
            Start-Sleep -Seconds 1
        }
        "0" {
            Write-Host ""
            Write-Host "👋 Até logo!" -ForegroundColor Cyan
            Write-Host ""
            break
        }
        default {
            Write-Host ""
            Write-Host "❌ Opção inválida! Tente novamente." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "0")
