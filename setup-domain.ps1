# Script para configurar domínio personalizado
# Execute: .\setup-domain.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

Write-Host "🌐 Configurando domínio personalizado: $Domain" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 INSTRUÇÕES DE CONFIGURAÇÃO DNS" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "1️⃣  NO SEU PROVEDOR DE DNS (ex: Registro.br, GoDaddy):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Adicione os seguintes registros:" -ForegroundColor White
Write-Host ""
Write-Host "   ┌─────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ TIPO │ NOME │ VALOR                        │" -ForegroundColor Gray
Write-Host "   ├─────────────────────────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ A    │ @    │ 76.76.21.21                  │" -ForegroundColor White
Write-Host "   │ CNAME│ www  │ cname.vercel-dns.com         │" -ForegroundColor White
Write-Host "   └─────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  NO VERCEL DASHBOARD:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   a) Acesse: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   b) Selecione seu projeto (pokerwizard)" -ForegroundColor White
Write-Host "   c) Settings → Domains" -ForegroundColor White
Write-Host "   d) Add Domain: $Domain" -ForegroundColor Yellow
Write-Host "   e) Siga as instruções de verificação" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  PARA O BACKEND (Render.com):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Se quiser usar subdomínio para API (ex: api.$Domain):" -ForegroundColor White
Write-Host ""
Write-Host "   No DNS:" -ForegroundColor White
Write-Host "   ┌─────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ TIPO │ NOME │ VALOR                        │" -ForegroundColor Gray
Write-Host "   ├─────────────────────────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ CNAME│ api  │ seu-app.onrender.com         │" -ForegroundColor White
Write-Host "   └─────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""
Write-Host "   No Render Dashboard:" -ForegroundColor White
Write-Host "   Settings → Custom Domain → Add: api.$Domain" -ForegroundColor Yellow
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "⏰ TEMPO DE PROPAGAÇÃO DNS: 1-48 horas (geralmente < 1h)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Verificar status da propagação:" -ForegroundColor Cyan
Write-Host "   https://dnschecker.org/#A/$Domain" -ForegroundColor White
Write-Host ""

Write-Host "✅ RESUMO:" -ForegroundColor Green
Write-Host "   Frontend: https://$Domain" -ForegroundColor White
Write-Host "   Backend:  https://api.$Domain" -ForegroundColor White
Write-Host ""

# Pergunta se quer abrir Vercel dashboard
$openDashboard = Read-Host "Abrir Vercel Dashboard agora? (s/n)"
if ($openDashboard -eq "s" -or $openDashboard -eq "S") {
    Start-Process "https://vercel.com/dashboard"
}

Write-Host ""
Write-Host "💡 Dica: Após adicionar o domínio no Vercel, o SSL será configurado automaticamente!" -ForegroundColor Cyan
