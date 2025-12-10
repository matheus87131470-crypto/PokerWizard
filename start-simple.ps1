# === Script Simples - PokerWizard ===
# Inicia Backend e Frontend em uma única janela (usando concurrently)

cd "C:\Users\Markim\Downloads\PokerWizard_PRO_Complete"

Write-Host "================================" -ForegroundColor Yellow
Write-Host "  PokerWizard - Modo Simples" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

# Verificar se concurrently está instalado
$hasconcurrent = npm list -g concurrently 2>$null
if (!$hasconcurrent) {
    Write-Host "📦 Instalando concurrently..." -ForegroundColor Cyan
    npm install -g concurrently
}

Write-Host "🚀 Iniciando Backend e Frontend..." -ForegroundColor Green
Write-Host ""

# Rodar ambos usando concurrently
npx concurrently --kill-others --names "SERVER,CLIENT" --prefix-colors "blue,magenta" `
    "cd server && npm install && npm run dev" `
    "cd client && npm install && npm run dev"
