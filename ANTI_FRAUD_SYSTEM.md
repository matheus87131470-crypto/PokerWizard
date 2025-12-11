# 🛡️ Sistema Anti-Fraude - PokerWizard

## 🎯 O que foi implementado

Sistema de proteção contra criação de múltiplas contas gratuitas para burlar o sistema.

---

## ✅ Mudanças Implementadas

### 1️⃣ Removido Login com Google
- ❌ Botão "Entrar com Google" removido
- ✅ Apenas login/registro local com email e senha
- ✅ Dados salvos permanentemente no servidor

### 2️⃣ Campo Nome Adicionado
- ✅ Obrigatório informar nome completo no registro
- ✅ Validação de nome não vazio

### 3️⃣ Sistema Anti-Fraude Implementado

#### 🔒 Proteções Ativas:

**a) Bloqueio por E-mail**
- Cada e-mail pode criar apenas 1 conta
- E-mails já registrados são bloqueados

**b) Bloqueio por IP**
- Limite: 1 conta a cada 24 horas por IP
- Mensagem: "Você já criou uma conta recentemente. Aguarde Xh"

**c) Bloqueio por Dispositivo**
- Máximo de 2 contas por dispositivo (fingerprint)
- Detecta mesmo navegador/computador
- Mensagem: "Limite de contas atingido neste dispositivo"

**d) Limpeza Automática**
- Registros mais antigos que 30 dias são removidos automaticamente
- Mantém banco de dados otimizado

---

## 🔍 Como Funciona

### Fingerprint do Dispositivo

O sistema gera um "fingerprint" único baseado em:
- User-Agent (navegador)
- Accept-Language (idioma)
- Screen Resolution (resolução da tela)
- Timezone (fuso horário)

```typescript
// Exemplo de fingerprint gerado
{
  userAgent: "Mozilla/5.0...",
  acceptLanguage: "pt-BR",
  screenResolution: "1920x1080",
  timezone: "America/Sao_Paulo"
}
```

### Detecção de IP Real

O sistema detecta o IP real mesmo atrás de proxies/CDN:
- Verifica `X-Forwarded-For`
- Verifica `X-Real-IP`
- Fallback para `req.ip`

---

## 📊 Regras de Bloqueio

| Tipo | Limite | Mensagem |
|------|--------|----------|
| **E-mail duplicado** | 1 conta | "Este e-mail já está registrado" |
| **Mesmo IP** | 1 conta / 24h | "Aguarde Xh para criar outra conta" |
| **Mesmo dispositivo** | 2 contas máximo | "Limite de contas atingido" |

---

## 💡 Casos de Uso

### ✅ Permitido:
1. Usuário cria 1ª conta → ✅ Sucesso
2. Aguarda 24h → Cria 2ª conta → ✅ Sucesso
3. Troca de dispositivo → Cria conta → ✅ Sucesso

### ❌ Bloqueado:
1. Usuário cria conta → Tenta criar outra no mesmo dia → ❌ Bloqueado
2. Usuário cria 2 contas no mesmo device → Tenta 3ª → ❌ Bloqueado
3. Usuário tenta registrar e-mail já usado → ❌ Bloqueado

---

## 🛠️ Testes

### Testar Sistema Anti-Fraude:

```powershell
# 1. Criar 1ª conta
# Acesse http://localhost:3000 e crie uma conta

# 2. Tentar criar 2ª conta imediatamente
# Deve mostrar: "Aguarde 24h para criar outra conta"

# 3. Criar conta com email duplicado
# Deve mostrar: "Este e-mail já está registrado"
```

---

## 📈 Estatísticas

O sistema mantém estatísticas:
- Total de contas criadas
- Contas criadas nas últimas 24h
- IPs únicos
- Dispositivos únicos

---

## ⚙️ Configuração

### Ajustar Tempo de Bloqueio

Arquivo: `server/src/services/antiFraud.ts`

```typescript
// Alterar de 24h para outro valor
const MIN_TIME_BETWEEN_ACCOUNTS = 24 * 60 * 60 * 1000; // 24 horas

// Exemplo: 1 hora
const MIN_TIME_BETWEEN_ACCOUNTS = 1 * 60 * 60 * 1000;

// Exemplo: 7 dias
const MIN_TIME_BETWEEN_ACCOUNTS = 7 * 24 * 60 * 60 * 1000;
```

### Ajustar Limite de Contas por Dispositivo

```typescript
// Mudar de 2 para outro valor
if (accountsFromDevice.length >= 2) {
  // Bloquear
}

// Exemplo: permitir 3 contas
if (accountsFromDevice.length >= 3) {
  // Bloquear
}
```

---

## 🔐 Segurança

### Dados Armazenados:
```json
{
  "ip": "177.123.45.67",
  "fingerprint": "a1b2c3d4e5f6...",
  "email": "usuario@email.com",
  "createdAt": "2025-12-10T10:30:00Z"
}
```

### Hashing:
- Fingerprint usa SHA-256
- Senhas salvas com bcrypt (já implementado)

---

## 🚨 Mensagens de Erro

### Cliente vê:
```
❌ "Você já criou uma conta recentemente. Aguarde 15h para criar outra."
❌ "Este e-mail já está registrado"
❌ "Limite de contas atingido neste dispositivo"
```

### Backend retorna:
```json
{
  "error": "account_creation_blocked",
  "message": "Você já criou uma conta recentemente...",
  "waitTime": 15
}
```

---

## 📝 Logs

Para ver tentativas bloqueadas, adicione ao backend:

```typescript
console.log('[ANTI-FRAUD] Blocked:', {
  ip: getRealIP(req),
  email,
  reason: fraudCheck.reason
});
```

---

## ✅ Checklist de Implementação

- [x] Removido login com Google
- [x] Adicionado campo Nome no registro
- [x] Implementado bloqueio por e-mail
- [x] Implementado bloqueio por IP (24h)
- [x] Implementado bloqueio por dispositivo (2 contas)
- [x] Limpeza automática de registros antigos
- [x] Validações de senha (mínimo 6 caracteres)
- [x] Mensagens de erro amigáveis
- [x] Sistema sincronizado no GitHub

---

## 🎯 Próximos Passos (Opcional)

Se quiser aumentar a segurança:

1. **Captcha**: Adicionar reCAPTCHA no registro
2. **Confirmação de E-mail**: Enviar link de ativação
3. **2FA**: Autenticação de dois fatores
4. **Rate Limiting**: Limitar tentativas de registro
5. **Dashboard Admin**: Painel para gerenciar bloqueios

---

**Sistema 100% funcional e sincronizado!** 🚀
