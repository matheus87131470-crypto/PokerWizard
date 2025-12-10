# 🎰 PokerWizard PRO

Plataforma completa de análise e treinamento de poker com IA.

## 🚀 Início Rápido

### 1. Iniciar o Projeto
```powershell
.\start-pokerwizard.ps1
```

### 2. Testar se está funcionando
```powershell
.\test-pokerwizard.ps1
```

### 3. Acessar a aplicação
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

---

## 📦 Estrutura do Projeto

```
PokerWizard_PRO_Complete/
├── client/              # Frontend (React + Vite)
├── server/              # Backend (Node.js + Express)
├── start-pokerwizard.ps1    # Script para iniciar tudo
├── test-pokerwizard.ps1     # Script de testes
└── START_GUIDE.md           # Guia completo de uso
```

---

## 🛠️ Tecnologias

### Frontend
- React 18
- Vite
- TypeScript
- React Router

### Backend
- Node.js
- Express
- TypeScript
- Passport (Google OAuth)
- JWT
- OpenAI API

---

## 📚 Documentação

- **[START_GUIDE.md](./START_GUIDE.md)** - Guia completo de inicialização
- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Deploy no Vercel e Render
- **[.env.example](./.env.example)** - Variáveis de ambiente

---

## 🔑 Configuração

1. Copie `.env.example` para `.env`:
```powershell
Copy-Item .env.example .env
```

2. Configure suas variáveis de ambiente no arquivo `.env`

3. Instale as dependências:
```powershell
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## 🧪 Testes

Execute os testes automáticos:
```powershell
.\test-pokerwizard.ps1
```

---

## 🚀 Deploy

Siga o guia completo em **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** para fazer deploy:
- **Frontend:** Vercel
- **Backend:** Render

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `start-pokerwizard.ps1` | Inicia backend e frontend em janelas separadas |
| `start-simple.ps1` | Inicia ambos em uma janela usando concurrently |
| `test-pokerwizard.ps1` | Testa se os serviços estão funcionando |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 👤 Autor

**matheus87131470-crypto**

- GitHub: [@matheus87131470-crypto](https://github.com/matheus87131470-crypto)
- Projeto: [PokerWizard](https://github.com/matheus87131470-crypto/PokerWizard)

---

## 🆘 Suporte

Se encontrar algum problema, abra uma [issue](https://github.com/matheus87131470-crypto/PokerWizard/issues).
