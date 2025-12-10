# 🚀 Scripts de Inicialização - PokerWizard

## 📂 Arquivos Disponíveis

### 1. `start-pokerwizard.ps1` (Recomendado)
Abre **duas janelas separadas** de terminal - uma para backend, outra para frontend.

**Vantagens:**
- ✅ Cada serviço em sua própria janela
- ✅ Fácil de visualizar logs separadamente
- ✅ Pode fechar um serviço sem afetar o outro

**Como usar:**
```powershell
.\start-pokerwizard.ps1
```

---

### 2. `start-simple.ps1` 
Executa ambos em **uma única janela** usando `concurrently`.

**Vantagens:**
- ✅ Tudo em um só lugar
- ✅ Logs coloridos lado a lado
- ✅ Usa menos janelas

**Como usar:**
```powershell
.\start-simple.ps1
```

---

## 🛠️ Configuração Inicial

### Primeira vez? Execute isso antes:

```powershell
# Permitir execução de scripts (apenas uma vez)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Navegar até o diretório
cd "C:\Users\Markim\Downloads\PokerWizard_PRO_Complete"

# Instalar dependências do backend
cd server
npm install

# Instalar dependências do frontend
cd ..\client
npm install

# Voltar para a raiz
cd ..
```

---

## 🎯 URLs após iniciar

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

---

## ⚠️ Solução de Problemas

### Erro: "cannot be loaded because running scripts is disabled"

Execute no PowerShell como Administrador:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Porta já em uso

Se a porta 3000 ou 3001 já estiver em uso, encerre o processo:
```powershell
# Ver processos na porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Frontend não carrega o Backend

Verifique se as URLs estão corretas em:
- `client/src/services/api.ts`
- `server/src/index.ts` (configuração CORS)

---

## 📝 Comandos Manuais

Se preferir rodar manualmente:

**Backend:**
```powershell
cd server
npm run dev
```

**Frontend (em outra janela):**
```powershell
cd client
npm run dev
```

---

## 🔧 Scripts Disponíveis

### Backend (`server/package.json`)
- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor compilado

### Frontend (`client/package.json`)
- `npm run dev` - Inicia Vite dev server
- `npm run build` - Build de produção
- `npm run preview` - Preview do build

---

## 💡 Dicas

1. **Desenvolvimento:** Use `start-pokerwizard.ps1`
2. **Produção:** Use `npm run build` em ambos
3. **Deploy:** Veja `DEPLOY_GUIDE.md`

---

## 🐛 Logs e Debug

Os logs aparecerão nas janelas de terminal. Para debug:
- Backend: Verifique `server/server.log` (se configurado)
- Frontend: Abra DevTools no navegador (F12)
