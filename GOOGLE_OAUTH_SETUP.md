# 🔐 Configuração do Google OAuth

## 📋 Visão Geral

O Google OAuth está configurado para funcionar em diferentes ambientes:
- **Local:** http://localhost:3000
- **Vercel:** https://pokerwizard.vercel.app
- **Render:** https://pokerwizard.onrender.com

## 🔑 Credenciais Atuais

- **Client ID:** `897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com`
- **Client Secret:** `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`

⚠️ **IMPORTANTE:** Essas credenciais já estão configuradas. Não compartilhe publicamente!

## 📂 Arquivos de Configuração

### Frontend
- **`client/src/config/googleAuth.ts`** - Configuração centralizada do Google OAuth

### Como usar no código:

```typescript
import { getGoogleAuthUrl, getRedirectUri } from '../config/googleAuth';

// Obter URL de autenticação do Google
const googleAuthUrl = getGoogleAuthUrl();
window.location.href = googleAuthUrl;

// Ou apenas obter o redirect URI
const redirectUri = getRedirectUri();
```

## 🌐 URIs de Redirecionamento Autorizadas

Configure no [Google Cloud Console](https://console.cloud.google.com/):

1. Acesse: APIs & Services > Credentials
2. Selecione seu OAuth 2.0 Client ID
3. Adicione as seguintes URIs autorizadas:

### JavaScript Origins:
```
http://localhost:3000
https://pokerwizard.vercel.app
https://pokerwizard.onrender.com
```

### Redirect URIs:
```
http://localhost:3000/login/callback
https://pokerwizard.vercel.app/login/callback
https://pokerwizard.onrender.com/login/callback
```

## 🛠️ Setup no Backend

Configure as variáveis de ambiente no backend:

### Arquivo `.env` (Local)
```env
GOOGLE_CLIENT_ID=897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
FRONTEND_URL=http://localhost:3000
```

### Render (Produção)
Adicione no dashboard do Render:
```
GOOGLE_CLIENT_ID=897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
FRONTEND_URL=https://pokerwizard.vercel.app
```

## 🔄 Fluxo de Autenticação

1. **Usuário clica em "Login com Google"**
   - Frontend detecta ambiente automaticamente
   - Redireciona para URL correta do Google

2. **Google autentica o usuário**
   - Usuário faz login no Google
   - Google redireciona de volta para o callback

3. **Backend processa o callback**
   - Recebe o código de autorização
   - Troca por access token
   - Cria/atualiza usuário no sistema
   - Retorna JWT para o frontend

4. **Frontend armazena o token**
   - Salva JWT no localStorage
   - Redireciona para a página principal

## ✅ Testar Localmente

1. Inicie backend e frontend:
```powershell
.\start-pokerwizard.ps1
```

2. Acesse: http://localhost:3000

3. Clique em "Login com Google"

4. Deve redirecionar corretamente para o Google

## 🐛 Solução de Problemas

### Erro: redirect_uri_mismatch

**Causa:** A URI de redirecionamento não está autorizada no Google Cloud Console

**Solução:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá para APIs & Services > Credentials
3. Adicione a URI correta (veja seção "URIs de Redirecionamento Autorizadas")

### Erro: 400 Bad Request

**Causa:** Client ID ou Secret incorretos

**Solução:**
1. Verifique as credenciais em `client/src/config/googleAuth.ts`
2. Confirme que as variáveis de ambiente estão corretas no backend

### Erro: CORS

**Causa:** Backend não está permitindo requisições do frontend

**Solução:**
1. Verifique CORS no backend (`server/src/index.ts`)
2. Certifique-se que `FRONTEND_URL` está configurado corretamente

## 📱 Exemplo de Uso

```typescript
// Login.tsx
import { getGoogleAuthUrl } from '../config/googleAuth';

const handleGoogleLogin = () => {
  const googleAuthUrl = getGoogleAuthUrl();
  window.location.href = googleAuthUrl;
};

return (
  <button onClick={handleGoogleLogin}>
    Login com Google
  </button>
);
```

## 🔐 Segurança

- ✅ Nunca commite credenciais no código
- ✅ Use variáveis de ambiente
- ✅ Configure HTTPS em produção
- ✅ Valide tokens no backend
- ✅ Use HttpOnly cookies quando possível

## 🌍 Deploy

### Frontend (Vercel)
Adicione variável de ambiente:
```
VITE_API_URL=https://seu-backend.onrender.com
```

### Backend (Render)
Adicione variáveis:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=https://seu-frontend.vercel.app
```

---

**Última atualização:** Dezembro 2025
