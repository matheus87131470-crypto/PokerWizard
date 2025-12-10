# 🔧 Corrigir Erro 400: redirect_uri_mismatch

## ❌ Erro Atual
```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação desse app é inválida
```

## 🎯 Solução

### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com: **m82136204@gmail.com**
3. Selecione seu projeto (ou crie um novo)

### Passo 2: Configurar URIs Autorizadas

1. No menu lateral, vá para: **APIs e Serviços** > **Credenciais**
2. Clique no seu **OAuth 2.0 Client ID**
3. Role até a seção **URIs de redirecionamento autorizados**

### Passo 3: Adicionar as URIs Corretas

Adicione EXATAMENTE estas URIs (copie e cole):

#### ✅ URIs de JavaScript Autorizadas:
```
http://localhost:3000
http://localhost:3001
https://pokerwizard.vercel.app
https://pokerwizard.onrender.com
```

#### ✅ URIs de Redirecionamento Autorizadas:
```
http://localhost:3000/login/callback
http://localhost:3001/api/auth/google/callback
https://pokerwizard.vercel.app/login/callback
https://pokerwizard.onrender.com/api/auth/google/callback
```

### Passo 4: Salvar

Clique em **SALVAR** no final da página.

---

## 🔍 Verificar Qual URI Está Sendo Usada

Abra o Console do navegador (F12) e execute:

```javascript
console.log('Redirect URI:', window.location.origin + '/login/callback');
```

Compare com as URIs que você adicionou no Google Cloud Console.

---

## 🛠️ Configuração Alternativa (Se ainda não funcionar)

### Opção 1: Usar Backend para Redirect

Atualize o código para usar o backend:

```typescript
// client/src/config/googleAuth.ts
export const getGoogleAuthUrl = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return `${API_URL}/api/auth/google`;
};
```

Então no backend, configure:

```typescript
// server/src/routes/auth.ts
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`
}));
```

### Opção 2: Criar Novo Client ID

Se nada funcionar, crie um novo Client ID:

1. No Google Cloud Console, vá para **Credenciais**
2. Clique em **+ CRIAR CREDENCIAIS** > **ID do cliente OAuth 2.0**
3. Tipo: **Aplicativo da Web**
4. Nome: **PokerWizard**
5. Adicione as URIs corretas (veja Passo 3)
6. Copie o novo Client ID e Secret
7. Atualize em `client/src/config/googleAuth.ts`

---

## 📝 Checklist de Verificação

- [ ] URIs de JavaScript adicionadas no Google Cloud Console
- [ ] URIs de Redirecionamento adicionadas no Google Cloud Console
- [ ] Salvou as alterações no Google Cloud Console
- [ ] Aguardou 5 minutos (propagação das mudanças)
- [ ] Limpou cache do navegador (Ctrl+Shift+Delete)
- [ ] Testou em janela anônima
- [ ] Verificou se o Client ID está correto

---

## 🐛 Debug

### Passo 1: Ver a URL completa que está sendo gerada

```javascript
// No console do navegador (F12)
import { getGoogleAuthUrl } from './config/googleAuth';
console.log(getGoogleAuthUrl());
```

### Passo 2: Extrair o redirect_uri da URL

A URL deve ser algo como:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=897535773446-llk10fu61j7sdi02vbn60hd8t95d9eah.apps.googleusercontent.com
  &redirect_uri=http://localhost:3000/login/callback
  &response_type=code
  &scope=email%20profile
```

### Passo 3: Confirmar que o redirect_uri está EXATAMENTE no Google Cloud Console

Copie o `redirect_uri` da URL acima e confirme que está EXATAMENTE assim no Google Cloud Console (sem espaços, sem caracteres extras).

---

## ⚡ Solução Rápida (Teste Imediato)

Se você quer testar AGORA, use este redirect_uri temporário:

1. No Google Cloud Console, adicione:
```
http://localhost:3000/login/callback
```

2. Reinicie o frontend:
```powershell
# Feche a janela atual do frontend e execute:
cd client
npm run dev
```

3. Aguarde 1-2 minutos
4. Teste novamente

---

## 📞 Suporte

Se ainda não funcionar, envie:
1. Screenshot do erro completo
2. Screenshot das URIs configuradas no Google Cloud Console
3. URL completa que está sendo gerada (copie do console do navegador)
