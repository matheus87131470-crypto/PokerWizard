# ✅ PokerWizard no Render - Guia Completo

## 🎉 Sua URL está pronta!

**Frontend/Backend:** https://pokerwizard.onrender.com

---

## 📋 Configuração do Render (Se ainda não fez)

### 1. Variáveis de Ambiente Obrigatórias

No Render Dashboard → Settings → Environment:

```env
# Essenciais
NODE_ENV=production
PORT=3000
JWT_SECRET=Kz9$dB@8uN3xV7qR4tP!zH6wL2mY0cGf#5sQ8bU1jE2rT6vZ

# URLs
API_URL=https://pokerwizard.onrender.com
FRONTEND_URL=https://pokerwizard.onrender.com

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Email (para recuperação de senha)
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-do-gmail
```

### 2. Build & Start Commands

```
Build Command: cd server && npm install
Start Command: cd server && npm start
```

### 3. Root Directory

```
Root Directory: ./
```

---

## 🚀 Deploy do Frontend

Agora que o backend está no Render, você pode fazer deploy do frontend:

### Opção 1: Vercel (Se funcionar agora)

```powershell
cd client
vercel --prod
```

### Opção 2: Render (Frontend também)

1. **Novo Static Site** no Render
2. Configure:
   ```
   Build Command: cd client && npm install && npm run build
   Publish Directory: client/dist
   ```
3. Environment Variables:
   ```
   VITE_API_BASE=https://pokerwizard.onrender.com
   ```

### Opção 3: Netlify

```powershell
cd client
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 🔧 Configuração Local Atualizada

Os arquivos já estão configurados para usar o Render:

- ✅ `client/.env.production` → `VITE_API_BASE=https://pokerwizard.onrender.com`
- ✅ `client/.env.development` → `VITE_API_BASE=http://localhost:3000`
- ✅ `server/.env` → URLs do Render configuradas
- ✅ Todas as páginas agora usam variável de ambiente

---

## 🧪 Testar Backend no Render

```powershell
# Teste se o backend está respondendo
curl https://pokerwizard.onrender.com/api/auth/me

# Ou abra no navegador:
https://pokerwizard.onrender.com/api/health
```

---

## 📱 Testar Localmente com Backend no Render

```powershell
# 1. Configure para usar Render em desenvolvimento
cd client
echo "VITE_API_BASE=https://pokerwizard.onrender.com" > .env.local

# 2. Inicie o frontend
npm run dev

# 3. Acesse
http://localhost:5173

# Agora seu frontend local está conectado ao backend no Render!
```

---

## ⚠️ Problemas Comuns

### Backend não responde (503)

**Causa:** Render Free tier "dorme" após 15min de inatividade

**Solução:** 
- Primeiro acesso demora ~30 segundos para "acordar"
- É normal! Aguarde e recarregue
- Ou upgrade para plano pago ($7/mês)

### CORS Error

**Causa:** Frontend de outra URL tentando acessar

**Solução:** Verifique se `FRONTEND_URL` está correto no Render

### Build Failed

**Causa:** Dependências não instaladas

**Solução:**
```
Build Command: cd server && npm install && npm run build
```

---

## 🎨 Deploy Frontend no Render

Se quiser frontend e backend no mesmo lugar:

### Método 1: Dois serviços separados

**Backend (Web Service):**
- Root: `server`
- Build: `npm install`
- Start: `npm start`

**Frontend (Static Site):**
- Root: `client`
- Build: `npm install && npm run build`
- Publish: `dist`

### Método 2: Tudo em um (mais complexo)

```
Build Command: npm install && cd server && npm install && cd ../client && npm install && npm run build
Start Command: cd server && npm start
```

---

## 🌐 Domínio Personalizado

No Render Dashboard:

1. **Settings** → **Custom Domain**
2. **Add Custom Domain**: `pokerwizard.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: pokerwizard.onrender.com
   ```
4. SSL automático em ~5 minutos

---

## 📊 Monitoramento

**Ver logs em tempo real:**
1. Render Dashboard
2. Selecione seu serviço
3. Logs

**Métricas:**
- Dashboard → Metrics
- CPU, RAM, Requests

---

## 💰 Custos

**Free Tier:**
- ✅ 750 horas/mês
- ✅ HTTPS grátis
- ✅ Deploy automático
- ⚠️ Dorme após 15min
- ⚠️ 100GB bandwidth

**Paid ($7/mês):**
- ✅ Não dorme
- ✅ 400GB bandwidth
- ✅ Suporte prioritário

---

## ✅ Checklist Final

- [x] Backend no Render: https://pokerwizard.onrender.com
- [ ] Frontend deployado (Vercel/Netlify/Render)
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado
- [ ] Email configurado (recuperação de senha)
- [ ] Testes funcionais (login, premium, etc)
- [ ] Domínio personalizado (opcional)

---

## 🚀 Próximos Passos

1. **Deploy do Frontend:**
   ```powershell
   # Tente Vercel novamente
   cd client
   vercel --prod
   
   # Ou use Netlify
   npm install -g netlify-cli
   netlify deploy --prod
   ```

2. **Configure Email:**
   - No Render: adicione `EMAIL_USER` e `EMAIL_PASS`
   - Use senha de app do Gmail

3. **Teste tudo:**
   - Login/Registro
   - Recuperação de senha
   - Pagamento PIX
   - Training Lab
   - GTO Solutions

---

## 🎉 Resumo

Seu PokerWizard está no ar em:

**Backend:** https://pokerwizard.onrender.com ✅

**Frontend:** Aguardando deploy
- Opção 1: Vercel
- Opção 2: Netlify
- Opção 3: Render Static Site

**Quer que eu te ajude com o deploy do frontend agora?** 🚀
