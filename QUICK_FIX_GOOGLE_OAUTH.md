# 🎯 SOLUÇÃO RÁPIDA - Erro redirect_uri_mismatch

## ⚡ O que fazer AGORA (5 minutos)

### 1️⃣ Abrir Google Cloud Console
👉 https://console.cloud.google.com/apis/credentials

### 2️⃣ Selecionar seu OAuth Client ID
Clique no Client ID que começa com: `897535773446-llk10fu61j...`

### 3️⃣ Adicionar ESTAS URIs EXATAS

#### 📍 URIs de JavaScript Autorizadas:
```
http://localhost:3000
http://localhost:3001
```

#### 📍 URIs de Redirecionamento Autorizadas:
```
http://localhost:3001/api/auth/google/callback
```

### 4️⃣ Clicar em SALVAR

### 5️⃣ Aguardar 2 minutos

### 6️⃣ Atualizar o Frontend

Modifique o arquivo: `client/src/pages/Login.tsx`

**ANTES:**
```typescript
const handleGoogleLogin = () => {
  const googleAuthUrl = getGoogleAuthUrl();
  window.location.href = googleAuthUrl;
};
```

**DEPOIS:**
```typescript
const handleGoogleLogin = () => {
  const API_BASE = 'http://localhost:3001';
  window.location.href = `${API_BASE}/api/auth/google`;
};
```

### 7️⃣ Reiniciar Ambos

```powershell
# Feche todas as janelas e execute:
.\start-pokerwizard.ps1
```

### 8️⃣ Testar Login

1. Acesse: http://localhost:3000
2. Clique em "Login com Google"
3. Deve funcionar! ✅

---

## 🔧 Por que isso funciona?

Antes, o frontend estava gerando a URL do Google diretamente.
Agora, o frontend redireciona para o BACKEND (`/api/auth/google`), e o backend cuida de tudo.

**Fluxo:**
```
Frontend → Backend (/api/auth/google) → Google → Backend (/callback) → Frontend
```

Isso garante que o `redirect_uri` seja sempre o correto!

---

## ✅ Verificação

Depois de fazer isso, você deve ver:

1. **Google Cloud Console**: URI `http://localhost:3001/api/auth/google/callback` adicionada ✅
2. **Frontend**: Redirecionando para `http://localhost:3001/api/auth/google` ✅
3. **Login funcionando**: Sem erro 400 ✅

---

## 🚨 Se AINDA não funcionar

Execute este comando para ver os logs do backend:

```powershell
cd server
npm run dev
```

E me envie:
1. O erro que aparece no terminal
2. Screenshot da tela de erro do Google
