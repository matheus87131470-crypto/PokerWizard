# 🔄 Sistema de Keep-Alive para Render.com

## ✅ Problema RESOLVIDO no Frontend

O sistema agora implementa **wake-up inteligente** que evita que o usuário veja a tela "Service waking up" do Render:

### 🎯 Como Funciona:

1. **Health Check Endpoint** (`/api/auth/health`)
   - Retorna status do servidor
   - Usado para detectar se servidor está dormindo

2. **Ping Preventivo no Google Auth**
   - Antes de redirecionar para `/api/auth/google`
   - Faz request em `/api/auth/health`
   - Aguarda servidor acordar (até 30s)
   - Só depois redireciona para Google OAuth

3. **Loading Visual Elegante**
   - Spinner animado
   - Mensagem: "Conectando ao servidor..."
   - Feedback em tempo real para o usuário

### 📝 Código Implementado:

```typescript
// Login.tsx
const handleGoogleAuth = async () => {
  setIsWakingUp(true);
  
  // 1. Ping health check (acorda servidor)
  await fetch(`${API_BASE}/api/auth/health`);
  
  // 2. Aguarda 1s para garantir estabilidade
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. Redireciona para Google OAuth
  window.location.href = `${API_BASE}/api/auth/google`;
};
```

---

## 🚀 OPCIONAL: Keep-Alive Automático

Se quiser **evitar que o servidor durma** (plano pago do Render):

### Opção 1: Cron Job Externo (Grátis)

Use um serviço como **cron-job.org** ou **UptimeRobot**:

```
URL para ping: https://pokerwizard-api.onrender.com/api/auth/health
Intervalo: A cada 10 minutos
Método: GET
```

### Opção 2: GitHub Actions (Grátis)

Crie `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # A cada 10 minutos

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Health Endpoint
        run: curl https://pokerwizard-api.onrender.com/api/auth/health
```

### Opção 3: Self-Ping no Servidor (Node.js)

Adicione no `server/src/index.ts`:

```typescript
// Keep-alive: Previne sleep do Render (plano gratuito)
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/api/auth/health`)
      .catch(() => console.log('Self-ping failed'));
  }, 10 * 60 * 1000); // 10 minutos
}
```

---

## 💡 Recomendação

**Para produção com tráfego real:**
- ✅ Use o sistema de wake-up inteligente (já implementado)
- ✅ Não precisa de keep-alive se aceita 1-2s de delay no primeiro acesso
- ✅ Se quiser 100% uptime, use cron-job.org (grátis)

**Para plano pago do Render:**
- O servidor nunca dorme
- Não precisa de nenhuma dessas soluções

---

## 📊 Comparação de Soluções

| Solução | Custo | Complexidade | Experiência Usuário |
|---------|-------|--------------|---------------------|
| **Wake-up inteligente** ✅ | Grátis | Baixa | Boa (1-2s delay) |
| Keep-alive externo | Grátis | Média | Excelente (0s delay) |
| Render pago | $7/mês | Zero | Perfeita |

---

## 🔍 Monitoramento

Health check endpoint disponível:
```
GET /api/auth/health

Response:
{
  "status": "ok",
  "timestamp": "2026-01-04T...",
  "uptime": 3600,
  "service": "pokerwizard-auth"
}
```

Use para:
- Verificar se servidor está acordado
- Monitorar uptime
- Integrar com ferramentas de monitoramento
