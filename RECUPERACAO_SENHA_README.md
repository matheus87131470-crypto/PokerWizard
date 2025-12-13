# 🔐 Sistema de Recuperação de Senha - PokerWizard

## ✨ Funcionalidades Implementadas

### Frontend
- ✅ Página de recuperação de senha (`/forgot-password`)
- ✅ Fluxo em 3 etapas:
  1. **Solicitar código** - Digite seu email
  2. **Verificar código** - Insira o código de 6 dígitos recebido por email
  3. **Nova senha** - Defina sua nova senha
- ✅ Design moderno com gradientes e glassmorphism
- ✅ Validações em tempo real
- ✅ Feedback visual de sucesso/erro
- ✅ Link "Esqueceu sua senha?" na página de login

### Backend
- ✅ 3 novas rotas de API:
  - `POST /api/auth/forgot-password` - Solicita recuperação
  - `POST /api/auth/verify-reset-code` - Verifica código
  - `POST /api/auth/reset-password` - Redefine senha
- ✅ Serviço de email com Nodemailer
- ✅ Geração de código de 6 dígitos
- ✅ Tokens com expiração de 15 minutos
- ✅ Template de email HTML profissional
- ✅ Segurança: códigos invalidados após uso

## 📧 Configuração de Email

### Para Produção (Gmail)

1. **Acesse** https://myaccount.google.com/apppasswords
2. **Crie** uma senha de aplicativo
3. **Configure** no arquivo `.env`:

```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx  # Senha de app gerada
```

### Para Testes Locais (Ethereal)

Deixe as variáveis de email vazias no `.env`. O sistema usará automaticamente o Ethereal (emails de teste).

Os emails NÃO serão realmente enviados, mas você verá uma URL no console do servidor para visualizar o email:

```
✅ Email enviado: <message-id>
📧 Preview URL: https://ethereal.email/message/xxxxx
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

### 3. Iniciar Servidor

```bash
npm run dev
```

### 4. Testar Recuperação de Senha

1. Acesse `http://localhost:5173/login`
2. Clique em "🔑 Esqueceu sua senha?"
3. Digite seu email
4. Verifique o código (no email ou no console do servidor se estiver usando Ethereal)
5. Digite o código de 6 dígitos
6. Defina sua nova senha

## 🔒 Segurança

- ✅ Códigos com 6 dígitos (1 milhão de combinações)
- ✅ Expiração automática em 15 minutos
- ✅ Invalidação após uso bem-sucedido
- ✅ Senhas hasheadas com bcrypt
- ✅ Limpeza automática de tokens expirados
- ✅ Não revela se email existe no sistema (por segurança)

## 📁 Arquivos Criados/Modificados

### Frontend
- ✅ `client/src/pages/ForgotPassword.tsx` (novo)
- ✅ `client/src/pages/Login.tsx` (modificado - adicionado link)
- ✅ `client/src/App.tsx` (modificado - adicionado rota)

### Backend
- ✅ `server/src/services/emailService.ts` (novo)
- ✅ `server/src/services/passwordResetService.ts` (novo)
- ✅ `server/src/services/userService.ts` (modificado - adicionado `updatePassword`)
- ✅ `server/src/routes/auth.ts` (modificado - adicionadas 3 rotas)

### Configuração
- ✅ `server/.env.example` (novo)
- ✅ `server/package.json` (nodemailer instalado)

## 🎯 Próximos Passos Opcionais

- [ ] Adicionar rate limiting (limitar tentativas por IP)
- [ ] Adicionar captcha na solicitação de recuperação
- [ ] Suporte para múltiplos idiomas no email
- [ ] Dashboard admin para ver tokens ativos
- [ ] Notificação por SMS (Twilio/AWS SNS)
- [ ] Log de tentativas de recuperação

## 🐛 Troubleshooting

### Email não está sendo enviado

1. Verifique se `EMAIL_USER` e `EMAIL_PASS` estão configurados corretamente
2. Para Gmail, certifique-se de usar **senha de app**, não sua senha normal
3. Verifique o console do servidor para erros
4. Em modo de teste, use Ethereal (deixe EMAIL_USER vazio)

### Código inválido ou expirado

- Códigos expiram em 15 minutos
- Códigos são invalidados após uso
- Verifique se o email está correto
- Gere um novo código se necessário

### Erro ao redefinir senha

- Senha deve ter pelo menos 6 caracteres
- Verifique se o código foi validado corretamente
- Tente gerar um novo código

## 📝 Exemplo de Email Enviado

```
De: "PokerWizard 🎯" <noreply@pokerwizard.com>
Para: usuario@email.com
Assunto: 🔐 Código de Recuperação de Senha - PokerWizard

┌─────────────────────────────────┐
│     🎯 PokerWizard              │
│     Recuperação de Senha        │
└─────────────────────────────────┘

Olá, João! 👋

Recebemos uma solicitação para redefinir a senha da 
sua conta no PokerWizard. Use o código abaixo:

╔═══════════════════════╗
║  SEU CÓDIGO          ║
║                       ║
║    1 2 3 4 5 6       ║
║                       ║
║  ⏰ Válido por 15 min ║
╚═══════════════════════╝

⚠️ Importante: Se você não solicitou esta recuperação,
ignore este email. Sua senha permanecerá inalterada.

Atenciosamente,
Equipe PokerWizard

─────────────────────────────────
© 2024 PokerWizard. Todos os direitos reservados.
Este é um email automático. Por favor, não responda.
```

## 💡 Dicas de Produção

1. **Use um serviço profissional de email:**
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

2. **Configure SPF/DKIM/DMARC** para evitar spam

3. **Monitore taxa de entrega** de emails

4. **Rate limiting** para evitar abuso (ex: max 3 tentativas por hora)

5. **Logs** de todas as tentativas de recuperação

6. **Alertas** quando houver múltiplas tentativas suspeitas

---

✅ **Sistema de recuperação de senha implementado com sucesso!**
