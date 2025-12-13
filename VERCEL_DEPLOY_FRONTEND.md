# 🚀 Deploy Frontend no Vercel - Guia Rápido

## Método 1: Via Dashboard Vercel (Recomendado)

### 1. Acesse o Vercel
👉 https://vercel.com

### 2. Faça login com GitHub
- Use a mesma conta do repositório PokerWizard

### 3. Importe o projeto
1. Clique em **"Add New Project"**
2. Selecione **"Import Git Repository"**
3. Escolha: `matheus87131470-crypto/PokerWizard`

### 4. Configure o projeto

**Framework Preset:** Vite

**Root Directory:** `client` ⚠️ IMPORTANTE!

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### 5. Variáveis de Ambiente

Adicione esta variável:

| Name | Value |
|------|-------|
| `VITE_API_BASE` | `https://pokerwizard.onrender.com` |

### 6. Deploy
Clique em **"Deploy"**

Aguarde 2-3 minutos.

---

## Método 2: Via CLI (Alternativo)

Se preferir usar linha de comando:

```powershell
# Instalar Vercel CLI (apenas uma vez)
npm install -g vercel

# Fazer deploy
cd client
vercel --prod
```

---

## ✅ Após o Deploy

Você receberá uma URL tipo:
```
https://poker-wizard-xyz.vercel.app
```

### Teste todas as funcionalidades:
- ✅ Login/Registro
- ✅ Recuperação de senha
- ✅ Pagamento PIX
- ✅ Training Lab
- ✅ GTO Solutions

---

## 🔧 Resolução de Problemas

### Erro: "Command failed: npm run build"
- Verifique se o **Root Directory** está em `client`
- Verifique se `VITE_API_BASE` está configurado

### API não conecta
- Verifique a variável de ambiente `VITE_API_BASE`
- Deve apontar para: `https://pokerwizard.onrender.com`

### Rotas 404
- Vercel deve ter rewrites configurado (já está no vercel.json)

---

## 📌 Domínio Customizado (Opcional)

No Vercel Dashboard:
1. Vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## 🎯 Resumo Rápido

1. Vercel Dashboard → Import Project
2. Repositório: `PokerWizard`
3. Root Directory: `client`
4. Variável: `VITE_API_BASE=https://pokerwizard.onrender.com`
5. Deploy!

**Backend:** https://pokerwizard.onrender.com ✅
**Frontend:** (sua URL do Vercel) ⏳
