# 🗄️ Configurar PostgreSQL no Render - Guia Completo

## Por que migrar para PostgreSQL?

Atualmente o sistema usa **arquivos JSON** (`server/data/*.json`) que são **perdidos** quando o Render reinicia o servidor (o que acontece automaticamente após inatividade).

Com PostgreSQL:
- ✅ Dados persistem permanentemente
- ✅ Não perde usuários, pagamentos, etc
- ✅ Gratuito no Render (500MB)
- ✅ Mais rápido e seguro

---

## Passo 1: Criar Banco PostgreSQL no Render

1. **Acesse:** https://dashboard.render.com

2. **Clique em "New +" → "PostgreSQL"**

3. **Configurações:**
   - **Name:** `pokerwizard-db`
   - **Database:** `pokerwizard`
   - **User:** `pokerwizard_user` (ou deixe padrão)
   - **Region:** Mesma do backend (Washington DC East)
   - **Plan:** **Free** (500MB, suficiente para começar)

4. **Clique em "Create Database"**

5. **Aguarde 1-2 minutos** até status ficar "Available"

6. **Copie a "Internal Database URL"** (começa com `postgresql://...`)
   - Você vai precisar dela!

---

## Passo 2: Adicionar Dependências

No seu terminal local:

```powershell
cd server
npm install pg drizzle-orm
npm install -D drizzle-kit @types/pg
```

---

## Passo 3: Adicionar DATABASE_URL no Render

1. **Vá para seu Web Service (backend):**
   https://dashboard.render.com → Seu serviço PokerWizard

2. **Settings → Environment Variables**

3. **Add New:**
   - **Name:** `DATABASE_URL`
   - **Value:** Cole a "Internal Database URL" que você copiou
   - **Environments:** Production, Preview, Development

4. **Save**

---

## Passo 4: Criar Schema do Banco

Vou criar os arquivos necessários para você:

### `server/drizzle.config.ts` (já existe)
Verificar se está correto.

### `server/src/db/schema.ts` (novo)
Define as tabelas (users, payments, etc)

### `server/src/db/index.ts` (novo)
Conexão com PostgreSQL

---

## Passo 5: Migrar Dados Existentes (Opcional)

Se você tiver dados nos arquivos JSON que quer preservar:

```powershell
# Script para importar dados de JSON para PostgreSQL
node server/tools/migrate-json-to-postgres.js
```

---

## Passo 6: Atualizar Código para Usar PostgreSQL

Os arquivos que precisam mudar:
- `server/src/services/userService.ts`
- `server/src/services/pixService.ts`
- `server/src/services/passwordResetService.ts`

---

## Passo 7: Deploy

```powershell
git add .
git commit -m "feat: migrate to PostgreSQL database"
git push origin main
```

O Render vai:
1. Detectar o push
2. Instalar novas dependências (pg, drizzle-orm)
3. Criar as tabelas automaticamente
4. Iniciar o servidor com PostgreSQL

---

## Verificar se Funcionou

1. Acesse: https://pokerwizard.onrender.com
2. Crie uma nova conta
3. Faça logout
4. **Aguarde 15 minutos** (Render vai colocar servidor em sleep)
5. Acesse novamente e faça login
6. **Se funcionar → Dados estão persistindo! ✅**

---

## Custos

- **PostgreSQL Free:** 500MB, ilimitado de requisições
- **Limitações:** Apenas 1 banco grátis por conta
- **Upgrade:** $7/mês para 10GB (se precisar no futuro)

---

## Próximo Passo

**Quer que eu implemente isso agora?**

Vai levar cerca de 10-15 minutos para:
1. Criar arquivos de schema
2. Atualizar services para usar PostgreSQL
3. Testar localmente
4. Fazer deploy

**Confirme se quer continuar!**
