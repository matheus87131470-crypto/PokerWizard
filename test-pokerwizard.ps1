# === Teste Automatico PokerWizard ===

# URLs do backend e frontend
$backendURL = "http://localhost:3001"
$frontendURL = "http://localhost:3000"

Write-Host "Iniciando testes do PokerWizard..." -ForegroundColor Cyan
Write-Host ""

# Funcao para testar se a URL esta respondendo
function Test-URL($url, $description) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $description - Status: $($response.StatusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[AVISO] $description - Status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "[ERRO] $description - Nao foi possivel acessar" -ForegroundColor Red
        Write-Host "       Detalhes: $($_.Exception.Message)" -ForegroundColor DarkGray
        return $false
    }
}

# Contador de sucessos
$totalTests = 0
$passedTests = 0

# Testar Backend
Write-Host "Testando Backend..." -ForegroundColor Cyan
$totalTests++
if (Test-URL "$backendURL" "Backend Principal") { $passedTests++ }
Write-Host ""

# Testar Frontend
Write-Host "Testando Frontend..." -ForegroundColor Cyan
$totalTests++
if (Test-URL "$frontendURL" "Frontend Principal") { $passedTests++ }
Write-Host ""

# Testar endpoints principais do Backend
Write-Host "Testando Endpoints do Backend..." -ForegroundColor Cyan
$endpoints = @(
    @{Path="/api/auth/status"; Name="Auth Status"},
    @{Path="/api/health"; Name="Health Check"},
    @{Path="/"; Name="Root Endpoint"}
)

foreach ($endpoint in $endpoints) {
    $fullURL = "$backendURL$($endpoint.Path)"
    $totalTests++
    if (Test-URL $fullURL $endpoint.Name) { $passedTests++ }
}

# Resumo dos testes
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Resumo dos Testes" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "Testes passados: $passedTests" -ForegroundColor Green
Write-Host "Testes falhados: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host ""

if ($passedTests -eq $totalTests) {
    Write-Host "Todos os testes passaram! Sistema pronto para uso." -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs disponiveis:" -ForegroundColor Cyan
    Write-Host "  Backend:  $backendURL" -ForegroundColor White
    Write-Host "  Frontend: $frontendURL" -ForegroundColor White
} else {
    Write-Host "Alguns testes falharam. Verifique os servicos." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Dicas de solucao:" -ForegroundColor Cyan
    Write-Host "  1. Certifique-se de que o backend e frontend estao rodando" -ForegroundColor White
    Write-Host "  2. Execute: .\start-pokerwizard.ps1" -ForegroundColor White
    Write-Host "  3. Aguarde alguns segundos e execute este teste novamente" -ForegroundColor White
}

Write-Host ""
