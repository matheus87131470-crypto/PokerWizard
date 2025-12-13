# 🔐 Guia Rápido - Recuperação de Senha

## Como Testar Agora Mesmo

### 1️⃣ Certifique-se de que o servidor está rodando

```bash
cd server
npm run dev
```

### 2️⃣ Acesse a página de login

Abra o navegador em: `http://localhost:5173/login`

### 3️⃣ Clique em "🔑 Esqueceu sua senha?"

Você será redirecionado para `/forgot-password`

### 4️⃣ Digite um email cadastrado

Por exemplo: `teste@example.com`

### 5️⃣ Verifique o código

**Modo de Teste (padrão):**
- O código aparecerá no **console do servidor** (terminal)
- Procure por uma linha como:
  ```
  ✅ Email enviado: <message-id>
  📧 Preview URL: https://ethereal.email/message/xxxxx
  ```
- Copie o link e abra no navegador para ver o email completo
- Ou procure no console uma linha com o código de 6 dígitos

**Modo de Produção (com Gmail configurado):**
- Verifique sua caixa de entrada
- O email virá de "PokerWizard 🎯"
- Assunto: "🔐 Código de Recuperação de Senha"

### 6️⃣ Digite o código de 6 dígitos

Por exemplo: `123456`

### 7️⃣ Defina sua nova senha

Mínimo 6 caracteres

### 8️⃣ Pronto! ✅

Você será redirecionado para o login com a nova senha

---

## 📧 Como Configurar Email Real (Gmail)

### Passo a Passo:

1. **Acesse sua conta Google**
   - Vá para: https://myaccount.google.com

2. **Ative a verificação em 2 etapas** (se ainda não ativou)
   - Segurança → Verificação em duas etapas

3. **Crie uma senha de app**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Outro (nome personalizado)"
   - Digite: "PokerWizard"
   - Clique em "Gerar"
   - **Copie a senha** gerada (formato: xxxx-xxxx-xxxx-xxxx)

4. **Configure no .env do servidor**

Edite o arquivo `server/.env`:

```env
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
```

5. **Reinicie o servidor**

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

6. **Teste novamente!**

Agora os emails serão enviados de verdade para a caixa de entrada.

---

## 🎨 Como Fica o Email

```
┌─────────────────────────────────────────┐
│ De: "PokerWizard 🎯"                    │
│ Para: usuario@email.com                 │
│ Assunto: 🔐 Código de Recuperação       │
└─────────────────────────────────────────┘

╔═════════════════════════════════════════╗
║          🎯 PokerWizard                 ║
║      Recuperação de Senha               ║
╚═════════════════════════════════════════╝

Olá, João! 👋

Recebemos uma solicitação para redefinir a senha 
da sua conta no PokerWizard.

┏━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ SEU CÓDIGO DE VERIFICAÇÃO ┃
┃                           ┃
┃      1 2 3 4 5 6         ┃
┃                           ┃
┃  ⏰ Válido por 15 minutos  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ Importante: Se você não solicitou esta 
recuperação, ignore este email. Sua senha 
permanecerá inalterada.

Atenciosamente,
Equipe PokerWizard

─────────────────────────────────────────
© 2024 PokerWizard. 
Todos os direitos reservados.
```

---

## 🔧 Troubleshooting

### ❌ "Email não encontrado"

**Solução:** Crie uma conta primeiro em `/login` → "Criar conta"

### ❌ "Código inválido ou expirado"

**Possíveis causas:**
- Código digitado incorretamente
- Passou de 15 minutos desde o envio
- Código já foi usado uma vez

**Solução:** Clique em "← Voltar" e solicite um novo código

### ❌ "Erro ao enviar email"

**Verifique:**
1. Servidor está rodando? (`npm run dev`)
2. Se estiver usando Gmail:
   - EMAIL_USER e EMAIL_PASS estão corretos?
   - Usou senha de app (não a senha normal)?
3. Console do servidor mostra erros?

**Solução rápida:** Deixe EMAIL_USER vazio para usar modo de teste (Ethereal)

### ❌ Não vejo o código no console

**Procure por:**
```
✅ Email enviado
📧 Preview URL
```

Se não aparecer, o servidor pode ter crashado. Reinicie com `npm run dev`

---

## 🎯 Features de Segurança

✅ **Código de 6 dígitos** (1 milhão de combinações)  
✅ **Expira em 15 minutos**  
✅ **Uso único** (invalida após redefinição)  
✅ **Senha hasheada** com bcrypt  
✅ **Não revela** se email existe (anti-enumeration)  
✅ **Limpeza automática** de tokens expirados  

---

## 📱 Interface do Usuário

### Tela 1: Email
- Campo de email
- Botão "Enviar Código"
- Link para voltar ao login

### Tela 2: Código
- Campo para 6 dígitos
- Validação em tempo real
- Botão "Verificar Código"
- Botão "← Voltar"

### Tela 3: Nova Senha
- Campo de nova senha
- Campo de confirmação
- Toggle mostrar/ocultar senha
- Botão "Redefinir Senha"

### Feedback Visual
- ✅ Mensagens de sucesso (verde)
- ❌ Mensagens de erro (vermelho)
- ⏳ Estados de loading
- 🎨 Design moderno com gradientes

---

## 🚀 Pronto para Usar!

O sistema está **100% funcional** e pronto para uso.

### Modo de Teste (padrão):
- Emails aparecem no console
- Não precisa configurar nada
- Perfeito para desenvolvimento

### Modo de Produção:
- Configure EMAIL_USER e EMAIL_PASS
- Emails enviados de verdade
- Pronto para deploy

---

**Dúvidas?** Veja o arquivo `RECUPERACAO_SENHA_README.md` para documentação completa.
