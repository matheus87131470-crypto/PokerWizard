# ================================================================
# TESTE DE FLUXO PIX - POKERWIZARD + MERCADO PAGO
# ================================================================
# Execute este script no PowerShell após o deploy do Render
# ================================================================

$API_BASE = "https://pokerwizard.onrender.com"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTE DE FLUXO PIX - POKERWIZARD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Verificar se API está online
Write-Host "[1/5] Verificando se API esta online..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_BASE/" -Method GET
    Write-Host "   OK: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ERRO: API offline ou inacessivel" -ForegroundColor Red
    exit 1
}

# 2. Testar rota de config admin (deve retornar 403 sem secret)
Write-Host "`n[2/5] Testando protecao do endpoint admin..." -ForegroundColor Yellow
try {
    $adminTest = Invoke-WebRequest -Uri "$API_BASE/api/payments/admin/config" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   FALHA: Endpoint admin acessivel sem secret!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "   OK: Endpoint admin protegido (403 Forbidden)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   AVISO: Endpoint nao encontrado (deploy pendente?)" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: $statusCode" -ForegroundColor Yellow
    }
}

# 3. Testar webhook sem assinatura (deve aceitar mas nao processar)
Write-Host "`n[3/5] Testando webhook do Mercado Pago..." -ForegroundColor Yellow
try {
    $webhookBody = '{"type":"payment","data":{"id":"12345"}}'
    $webhook = Invoke-WebRequest -Uri "$API_BASE/api/payments/webhook/mercadopago" -Method POST -Body $webhookBody -ContentType "application/json" -UseBasicParsing
    $response = $webhook.Content | ConvertFrom-Json
    Write-Host "   OK: Webhook responde (status=$($webhook.StatusCode))" -ForegroundColor Green
    Write-Host "   Resposta: $($webhook.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   AVISO: Rota webhook nao encontrada (deploy pendente?)" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: $statusCode" -ForegroundColor Yellow
    }
}

# 4. Testar rota /confirm (deve retornar 403)
Write-Host "`n[4/5] Testando bloqueio da rota /confirm..." -ForegroundColor Yellow
try {
    $confirm = Invoke-WebRequest -Uri "$API_BASE/api/payments/confirm" -Method POST -Body '{"paymentId":"test"}' -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "   FALHA: Rota /confirm acessivel!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "   OK: Rota /confirm bloqueada (403 Forbidden)" -ForegroundColor Green
    } elseif ($statusCode -eq 401) {
        Write-Host "   OK: Requer autenticacao (esperado)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   AVISO: Rota nao encontrada (deploy pendente?)" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: $statusCode" -ForegroundColor Yellow
    }
}

# 5. Testar create-pix sem autenticacao (deve retornar 401)
Write-Host "`n[5/5] Testando create-pix sem autenticacao..." -ForegroundColor Yellow
try {
    $createPix = Invoke-WebRequest -Uri "$API_BASE/api/payments/create-pix" -Method POST -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    Write-Host "   FALHA: create-pix acessivel sem token!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   OK: Requer autenticacao (401 Unauthorized)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   AVISO: Rota nao encontrada (deploy pendente?)" -ForegroundColor Yellow
    } else {
        Write-Host "   Status: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTE CONCLUIDO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "PROXIMO PASSO:" -ForegroundColor Yellow
Write-Host "1. Aguarde o Render fazer o redeploy (1-2 min)" -ForegroundColor White
Write-Host "2. Execute este script novamente" -ForegroundColor White
Write-Host "3. Todos os testes devem passar com OK" -ForegroundColor White
Write-Host ""
