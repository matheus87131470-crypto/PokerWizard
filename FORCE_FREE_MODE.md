# 🧪 FORCE_FREE_MODE - Modo de Teste

## O que é?

`FORCE_FREE_MODE` é uma constante que força o sistema a se comportar como um usuário **FREE**, ignorando completamente qualquer flag PRO, assinatura ou acesso premium.

## Como usar?

### Ativar o modo de teste:

```typescript
// client/src/contexts/AuthContext.tsx
export const FORCE_FREE_MODE = true;  // ✅ Modo FREE ativo
```

### Desativar (modo normal):

```typescript
// client/src/contexts/AuthContext.tsx
export const FORCE_FREE_MODE = false;  // ⚠️ Modo normal (respeita premium real)
```

## O que acontece quando está ATIVO?

1. **AuthContext**:
   - `user.premium` sempre será `false`
   - Mesmo usuários PRO verão a interface FREE
   - Badges "PRO" não aparecem
   - Botão "Upgrade" fica visível

2. **usePaywall**:
   - `isPremium` sempre retorna `false`
   - `statusPlano` sempre é `'free'`
   - `freeCredits` limitado a 7 (não ilimitado)
   - Paywall será exibido após 7 usos

3. **Todas as features**:
   - Trainer: limitado a 7 usos
   - Analyze: limitado a 7 usos
   - Créditos compartilhados globalmente

## Onde está implementado?

### 1. AuthContext (`client/src/contexts/AuthContext.tsx`)

```typescript
// Linha 4-5
export const FORCE_FREE_MODE = true;

// Aplicado em:
- fetchUserInfo()  // Ao validar token
- login()          // Ao fazer login
- register()       // Ao criar conta
```

### 2. usePaywall (`client/src/hooks/usePaywall.ts`)

```typescript
// Linha 8
import { FORCE_FREE_MODE } from '../contexts/AuthContext';

// Aplicado em:
- refreshUsage()           // Ao buscar status da API
- checkLocalStoragePremium() // Fallback localStorage
- isPremium (variável derivada)
```

## ⚠️ IMPORTANTE

### Antes de fazer deploy para produção:

```typescript
export const FORCE_FREE_MODE = false;  // SEMPRE false em produção!
```

### Checklist pré-deploy:

- [ ] FORCE_FREE_MODE = false em AuthContext
- [ ] Testar login com usuário PRO real
- [ ] Verificar se badges PRO aparecem
- [ ] Confirmar que créditos são ilimitados para PRO
- [ ] Testar todas as features sem paywall

## Debug

O sistema loga no console quando FORCE_FREE_MODE está ativo:

```
[usePaywall] 🧪 FORCE_FREE_MODE ativo - forçando modo FREE
```

Procure por esse emoji 🧪 nos logs do console para confirmar o modo de teste.

## Casos de uso

✅ **Quando usar:**
- Testar fluxo completo de usuário FREE
- Validar paywall e limites de créditos
- Verificar mensagens de upgrade
- Simular experiência de novos usuários

❌ **Quando NÃO usar:**
- Produção (nunca!)
- Testar features premium
- Validar assinaturas reais
- Deploy em Vercel/Render

## Restaurar comportamento normal

Para voltar ao modo normal (produção):

1. Abra `client/src/contexts/AuthContext.tsx`
2. Mude para `export const FORCE_FREE_MODE = false;`
3. Salve o arquivo
4. Recarregue a aplicação (F5)
5. Faça logout/login se necessário

---

**Criado em:** 4 de janeiro de 2026  
**Versão:** 1.0  
**Status:** 🧪 Experimental - Apenas para testes
