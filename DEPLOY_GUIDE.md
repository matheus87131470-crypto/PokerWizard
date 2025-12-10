# PokerWizard - Guia de Deployment

## 🚀 Deploy no Vercel (Frontend)

### Passo 1: Conectar ao Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione seu repositório GitHub
4. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `.` (raiz do projeto)

### Passo 2: Configurar Variáveis de Ambiente
No dashboard do Vercel, vá para **Settings > Environment Variables** e adicione:
```
VITE_API_URL=https://seu-backend.onrender.com
```

### Passo 3: Deploy
Clique em "Deploy" - o Vercel fará automaticamente!

---

## 🚀 Deploy no Render (Backend)

### Passo 1: Conectar ao Render
1. Acesse [render.com](https://render.com)
2. Clique em "New +" > "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `pokerwizard-api`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm run start`
   - **Plan**: Free (ou pago conforme necessário)

### Passo 2: Configurar Variáveis de Ambiente
No dashboard do Render, vá para **Environment** e adicione:
```
PORT=3000
NODE_ENV=production
JWT_SECRET=sua_chave_jwt_secreta
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
FRONTEND_URL=https://seu-frontend.vercel.app
```

### Passo 3: Deploy
Clique em "Create Web Service" - o Render fará automaticamente!

---

## 🔗 Conectar Frontend e Backend

Após ambos estarem deployados, atualize:

**Frontend (`src/services/api.ts` ou similar):**
```typescript
const API_URL = process.env.VITE_API_URL || 'https://seu-backend.onrender.com';
```

**Backend (`src/index.ts`):**
```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://seu-frontend.vercel.app';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
```

---

## 📝 URLs Após Deploy

- **Frontend**: `https://seu-projeto.vercel.app`
- **Backend**: `https://seu-projeto.onrender.com`

---

## ❓ Dúvidas?

Consulte a documentação:
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
