# === Script para rodar Backend + Frontend juntos - PokerWizard ===

# Caminhos dos projetos
$backendPath = "C:\Users\Markim\Downloads\PokerWizard_PRO_Complete\server"
$frontendPath = "C:\Users\Markim\Downloads\PokerWizard_PRO_Complete\client"

# Funcao para rodar cada projeto em uma nova janela do terminal
function Run-Project($path, $script, $name) {
    Write-Host "Iniciando $name..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$path'; Write-Host '=== $name ===' -ForegroundColor Green; $script"
}

Write-Host "================================" -ForegroundColor Yellow
Write-Host "  PokerWizard - Inicializando" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

# Rodar Backend
Run-Project $backendPath "npm install; npm run dev" "Backend (Server)"

# Aguardar 2 segundos antes de iniciar o frontend
Start-Sleep -Seconds 2

# Rodar Frontend
Run-Project $frontendPath "npm install; npm run dev" "Frontend (Client)"

Write-Host ""
Write-Host "Backend e Frontend iniciados em janelas separadas!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Dica: Verifique as janelas de terminal que foram abertas" -ForegroundColor Yellow
Write-Host ""
