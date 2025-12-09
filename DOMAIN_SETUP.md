# 🌍 Configuração do Domínio: pokerscope.com

## 📋 Checklist de Configuração

### ✅ 1. Configuração Frontend (React + Vite)

**Arquivo: `client/.env.local` (desenvolvimento)**
```
VITE_API_BASE=http://localhost:3000
```

**Arquivo: `client/.env.production` (produção)**
```
VITE_API_BASE=https://pokerscope.com
```

**Mudanças realizadas:**
- ✅ `client/src/pages/Login.tsx` — URL de Google OAuth agora dinâmica (usa `VITE_API_BASE`)
- ✅ `client/src/contexts/AuthContext.tsx` — Já usa `VITE_API_BASE`
- ✅ Todos os outros componentes que fazem fetch usam `VITE_API_BASE`

---

### ✅ 2. Configuração Backend (Node.js + Express)

**Arquivo: `server/.env` (agora com novos campos)**
```
GOOGLE_CLIENT_ID=897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=9f8d8f9d8fd9f8df9df8d9f8df9df8d

# Development URLs
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Production URLs (descomente ao fazer deploy)
# API_URL=https://pokerscope.com
# FRONTEND_URL=https://pokerscope.com
```

**Mudanças sugeridas (implementar após deploy):**
- Usar `process.env.API_URL` em `server/src/routes/auth.ts` para retornar callback URLs corretas
- Usar `process.env.FRONTEND_URL` em redirects

---

### 🔐 3. Configurar OAuth do Google

**Passo a passo:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para **APIs & Services** → **Credentials**
3. Edite a credencial OAuth 2.0 (Client ID)
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://pokerscope.com/api/auth/callback/google
   http://localhost:3000/api/auth/google (manter para desenvolvimento)
   ```
5. Salve as alterações

**Nota:** O `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` já estão configurados no `.env`. Eles funcionarão para qualquer domínio enquanto os URIs de redirecionamento estiverem autorizados.

---

### 🌐 4. Registros DNS Necessários

Para que `pokerscope.com` aponte para seu servidor, configure estes registros no seu provedor DNS (GoDaddy, Cloudflare, HostGator, etc.):

#### **A. Registro A (apontamento do domínio)**
```
Type:  A
Name:  @ (ou deixar em branco)
Value: [SEU_IP_DO_SERVIDOR]
TTL:   3600 (ou padrão do provedor)
```
**Exemplo:** Se seu servidor está em `192.168.1.100`, este registro faz `pokerscope.com` apontar para ele.

#### **B. Registro CNAME (www)**
```
Type:  CNAME
Name:  www
Value: pokerscope.com.
TTL:   3600
```
**Exemplo:** Isso faz `www.pokerscope.com` apontar para `pokerscope.com`

#### **C. Registros TXT (SPF, DKIM, DMARC) - Opcional mas recomendado**
```
Type:  TXT
Name:  @ (raiz)
Value: v=spf1 include:_spf.google.com ~all
TTL:   3600
```
**Objetivo:** Melhorar entrega de emails (se usar)

#### **D. Certificado SSL/TLS (HTTPS)**
**CRÍTICO:** Seu site DEVE ter HTTPS (`https://pokerscope.com`) em produção.

**Opções:**
1. **Let's Encrypt + Nginx/Apache** (gratuito):
   ```bash
   sudo certbot certonly --standalone -d pokerscope.com -d www.pokerscope.com
   ```

2. **CloudFlare** (recomendado):
   - Cadastre domínio → Cloudflare cuida de DNS + SSL automático
   - Aponte nameservers para Cloudflare

3. **AWS Certificate Manager** (se hospedar em AWS)

---

### 📝 5. Configuração da Aplicação para Produção

#### **Backend (server/.env)**
```env
# Mudanças para produção:
API_URL=https://pokerscope.com
FRONTEND_URL=https://pokerscope.com
GOOGLE_CLIENT_ID=... (mesmo ID, mas authorize o callback URI em produção)
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=... (usar valor forte em produção!)
```

#### **Frontend Build**
```bash
cd client
npm run build  # Gera otimizado em client/dist/
```

#### **Nginx/Apache Config (exemplo com Nginx)**
```nginx
server {
    listen 443 ssl http2;
    server_name pokerscope.com www.pokerscope.com;

    ssl_certificate /etc/letsencrypt/live/pokerscope.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pokerscope.com/privkey.pem;

    # Servir frontend
    location / {
        root /var/www/pokerwizard/client/dist;
        try_files $uri /index.html;
    }

    # Proxy para backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name pokerscope.com www.pokerscope.com;
    return 301 https://$server_name$request_uri;
}
```

---

### 🔄 6. Passos de Deploy (Resumido)

1. **Adquirir domínio** em registrador (GoDaddy, Namecheap, etc.)
2. **Configurar DNS** com registros A + CNAME (veja seção 4)
3. **Gerar certificado SSL** (Let's Encrypt recomendado)
4. **Compilar frontend**: `npm run build` em `client/`
5. **Atualizar `.env`** do backend com URLs de produção
6. **Iniciar backend**: `npm start` ou `pm2 start ...`
7. **Configurar reverse proxy** (Nginx) para servir frontend + proxy /api
8. **Testar**: Abrir `https://pokerscope.com` no navegador

---

### 🧪 Teste Local Antes de Deploy

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
# Atualize .env.local temporariamente:
# VITE_API_BASE=http://localhost:3000
npm run dev

# Terminal 3: Acesse no navegador
# http://localhost:5173
```

---

### ⚠️ Importante: Google OAuth em Produção

Quando fizer deploy com o domínio `pokerscope.com`:

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para **Credentials**
3. Edite o Client ID OAuth
4. Em **Authorized redirect URIs**, ADICIONE (não remova o localhost):
   ```
   https://pokerscope.com/api/auth/callback/google
   https://pokerscope.com/api/auth/google
   ```
5. Salve

O callback `/api/auth/google` é tratado no backend em `server/src/routes/auth.ts`.

---

## 📞 Resumo: O que fazer agora?

1. ✅ **Código já atualizado**:
   - Frontend: `.env.local` e `.env.production`
   - `Login.tsx`: URL dinâmica
   - Backend: `.env` com `API_URL` e `FRONTEND_URL`

2. 📋 **Próximas ações**:
   - [ ] Adquirir domínio `pokerscope.com`
   - [ ] Configurar registros DNS (A + CNAME)
   - [ ] Gerar certificado SSL
   - [ ] Atualizar Google OAuth credentials
   - [ ] Fazer deploy

3. 🚀 **Comando de build para produção**:
   ```bash
   cd client && npm run build
   # Resultado: client/dist/ (pronto para servir via Nginx)
   ```

Qualquer dúvida sobre DNS ou SSL, avise! 🎯
