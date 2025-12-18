# 🔧 CORREÇÕES IMPLEMENTADAS - Sistema de Créditos

**Data:** 18 de dezembro de 2025
**Commit:** b5fe83d

## ✅ PROBLEMAS CORRIGIDOS

### 1️⃣ ANALYZE — Consumo de Créditos
**Problema:**
- Análises não consumiam créditos
- Contador no header ficava fixo em "5/5"
- Paywall nunca aparecia

**Solução:**
- ✅ Adicionada coluna `usos_analise` no banco de dados
- ✅ `deductCredit()` agora decrementa `usosAnalise` especificamente
- ✅ Backend retorna `remaining: user.usosAnalise` (em vez de `credits`)
- ✅ Frontend chama `refreshUser()` após cada análise
- ✅ Header exibe valor dinâmico de `auth.user.usosAnalise`

**Arquivos alterados:**
- `server/src/services/database.ts` - Schema + migration
- `server/src/services/userService.ts` - Lógica de deductCredit
- `server/src/routes/ai.ts` - Response corrigido

---

### 2️⃣ PRACTICE (Trainer) — Liberar para FREE
**Problema:**
- FREE não conseguia usar Practice
- Usuário FREE não entendia o valor do produto

**Solução:**
- ✅ Adicionada coluna `usos_trainer` no banco de dados
- ✅ `deductCredit(userId, 'trainer')` decrementa `usosTrainer`
- ✅ Frontend já tinha `PaywallOverlay` implementado
- ✅ FREE pode jogar 5 mãos, depois aparece paywall

**Arquivos alterados:**
- `server/src/controllers/playerController.ts` - Response corrigido

---

### 3️⃣ RANGES — Preview para FREE
**Problema:**
- FREE não conseguia ver nada
- Parecia quebrado

**Solução:**
- ✅ **JÁ ESTAVA CORRETO!**
- ✅ FREE pode visualizar todos os ranges
- ✅ Apenas "Explicação com IA" é bloqueada (soft paywall)
- ✅ Badge "Preview" visível

**Status:** Nenhuma alteração necessária

---

### 4️⃣ HEADER — Contador Dinâmico
**Problema:**
- Mostrava "5/5 análises" fixo
- Nunca mudava mesmo após uso

**Solução:**
- ✅ **JÁ ESTAVA CORRETO!**
- ✅ Header usa `(auth.user as any).usosAnalise` dinamicamente
- ✅ `refreshUser()` atualiza o contexto após cada ação
- ✅ Cor muda para vermelho quando `usosAnalise === 0`

**Problema real:** Banco não tinha a coluna, então sempre retornava 0

---

## 🗄️ MIGRATION NECESSÁRIA

### Render PostgreSQL (Produção)

**Passo 1:** Conectar ao banco via Dashboard do Render

**Passo 2:** Executar migration:

```sql
-- Migration: Adicionar colunas específicas de créditos
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_analise INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_trainer INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS usos_jogadores INTEGER DEFAULT 5;

-- Popular usuários existentes
UPDATE users 
SET usos_analise = 5 
WHERE usos_analise IS NULL OR usos_analise = 0;

UPDATE users 
SET usos_trainer = 5 
WHERE usos_trainer IS NULL OR usos_trainer = 0;

UPDATE users 
SET usos_jogadores = 5 
WHERE usos_jogadores IS NULL OR usos_jogadores = 0;

-- Usuários premium = ilimitado
UPDATE users 
SET usos_analise = 999999,
    usos_trainer = 999999,
    usos_jogadores = 999999
WHERE premium = true OR status_plano = 'premium';
```

**Passo 3:** Verificar:

```sql
SELECT id, email, premium, usos_analise, usos_trainer, usos_jogadores 
FROM users 
LIMIT 10;
```

---

## 🔄 FLUXO CORRIGIDO

### Análise (Analyze)
1. User clica "Analisar"
2. Frontend chama `POST /api/ai/analyze`
3. Backend chama `deductCredit(userId, 'analise')`
4. Backend decrementa `usosAnalise` em 1
5. Backend retorna `remaining: user.usosAnalise`
6. Frontend chama `refreshUser()`
7. Header atualiza automaticamente
8. Se `usosAnalise === 0`, `PaywallOverlay` aparece

### Trainer (Practice)
1. User clica "Começar Treino"
2. Frontend chama `consumeUse()` → `POST /api/trainer/generate`
3. Backend chama `deductCredit(userId, 'trainer')`
4. Backend decrementa `usosTrainer` em 1
5. Backend retorna `remaining: user.usosTrainer`
6. Frontend chama `refreshUser()`
7. Se `usosTrainer === 0`, `PaywallOverlay` aparece

---

## 📊 CAMPOS DO USUÁRIO

### Antes (problema)
```typescript
{
  credits: 7,           // Global, não específico
  usosRestantes: 7,     // Global, não específico
  freeCredits: 7        // Global, não específico
}
```

### Depois (correto)
```typescript
{
  // Campos globais (legacy, mantidos)
  credits: 7,
  usosRestantes: 7,
  freeCredits: 7,
  
  // Campos específicos (NOVOS) ✅
  usosAnalise: 5,       // Análises de mãos
  usosTrainer: 5,       // Treinos GTO
  usosJogadores: 5      // Busca de jogadores
}
```

---

## 🎯 REGRAS DE NEGÓCIO

### FREE
- **Analyze:** 5 análises gratuitas
- **Trainer:** 5 treinos gratuitos
- **Ranges:** Preview completo (leitura)
- **Players:** 5 buscas gratuitas (futuro)

### PREMIUM
- Todos os campos = 999999 (ilimitado)
- Sem PaywallOverlay
- Sem contadores no header

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após deploy + migration, validar:

- [ ] Criar conta FREE nova
- [ ] Fazer 1 análise → contador deve mudar para "4/5"
- [ ] Fazer 4 análises → contador deve chegar em "0/5"
- [ ] Tentar 6ª análise → PaywallOverlay deve aparecer
- [ ] Fazer 1 treino → contador Trainer deve decrementar
- [ ] Header deve refletir valores reais do banco
- [ ] Usuário premium não deve ver contadores

---

## 🚀 DEPLOY

### Backend (Render)
- ✅ Commit b5fe83d pushed
- ✅ Render auto-deploy iniciado
- ⏳ Executar migration SQL manual
- ⏳ Validar com usuário real

### Frontend (Vercel)
- ✅ Vercel auto-deploy do commit b5fe83d
- ✅ Sem alterações no frontend necessárias

---

## 📝 NOTAS TÉCNICAS

### Por que campos separados?
- Permite controle granular (5 análises + 5 treinos)
- Facilita analytics ("quantas análises FREE estão sendo usadas?")
- Permite ofertas personalizadas ("Ganhe +10 análises bônus!")

### Compatibilidade
- `freeCredits` e `usosRestantes` mantidos para backward compatibility
- Novos usuários recebem ambos (global e específicos)
- Usuários antigos recebem campos específicos via migration

### Performance
- Sem impacto: migrations adicionam colunas com DEFAULT
- Queries continuam rápidas (índices existentes não afetados)
- `refreshUser()` já existia, apenas retorna campos novos

---

**Status:** ✅ Todas as correções implementadas e testadas localmente
**Próximo passo:** Executar migration no banco de produção (Render)
