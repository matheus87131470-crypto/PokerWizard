import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Configuração do transporter (use variáveis de ambiente em produção)
const createTransporter = () => {
  // Opção 1: Gmail (requer senha de aplicativo)
  // Para criar senha de app: https://myaccount.google.com/apppasswords
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📧 Usando Gmail para envio de emails');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Senha de aplicativo
      },
    });
  }

  // Opção 2: Ethereal (apenas para testes - emails não são realmente enviados)
  console.warn('⚠️  EMAIL_USER e EMAIL_PASS não configurados. Emails serão simulados.');
  
  return null; // Retorna null para indicar modo simulado
};

export async function sendPasswordResetEmail(email: string, code: string, name: string) {
  const transporter = createTransporter();

  // Se não tem transporter configurado, simula o envio mas loga o código
  if (!transporter) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL SIMULADO (configure EMAIL_USER e EMAIL_PASS para envio real)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Para: ${email}`);
    console.log(`   Nome: ${name}`);
    console.log(`   🔑 CÓDIGO: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return { success: true, messageId: 'simulated-' + Date.now(), simulated: true };
  }

  const mailOptions: EmailOptions = {
    to: email,
    subject: '🔐 Código de Recuperação de Senha - PokerWizard',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      🎯 PokerWizard
                    </h1>
                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Recuperação de Senha
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">
                      Olá, <strong>${name}</strong>! 👋
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no PokerWizard. 
                      Use o código abaixo para continuar:
                    </p>

                    <!-- Code Box -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 600;">
                        SEU CÓDIGO DE VERIFICAÇÃO
                      </p>
                      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 20px; margin: 10px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${code}
                        </span>
                      </div>
                      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 12px;">
                        ⏰ Válido por 15 minutos
                      </p>
                    </div>

                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 13px; color: #856404;">
                        <strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação, ignore este email. 
                        Sua senha permanecerá inalterada.
                      </p>
                    </div>

                    <p style="margin: 20px 0 0 0; font-size: 14px; color: #666666;">
                      Atenciosamente,<br>
                      <strong>Equipe PokerWizard</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      © ${new Date().getFullYear()} PokerWizard. Todos os direitos reservados.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 11px; color: #999999;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail({
      from: `"PokerWizard 🎯" <${process.env.EMAIL_USER || 'noreply@pokerwizard.com'}>`,
      ...mailOptions,
    });

    console.log('✅ Email enviado:', info.messageId);
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de recuperação');
  }
}

// Para testes - gera conta Ethereal automaticamente
export async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  console.log('🧪 Conta de teste criada:');
  console.log('   User:', testAccount.user);
  console.log('   Pass:', testAccount.pass);
  console.log('   SMTP:', testAccount.smtp.host, ':', testAccount.smtp.port);
  return testAccount;
}
