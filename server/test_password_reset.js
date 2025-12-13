// Script de teste para o sistema de recuperação de senha
// Execute com: node test_password_reset.js

const BASE_URL = 'http://localhost:3000/api/auth';

// Teste 1: Solicitar código de recuperação
async function testRequestCode(email) {
  console.log('\n📧 Teste 1: Solicitando código de recuperação...');
  
  const response = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Resposta:', data);
  
  return data.ok;
}

// Teste 2: Verificar código
async function testVerifyCode(email, code) {
  console.log('\n🔍 Teste 2: Verificando código...');
  
  const response = await fetch(`${BASE_URL}/verify-reset-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Resposta:', data);
  
  return data.ok;
}

// Teste 3: Redefinir senha
async function testResetPassword(email, code, newPassword) {
  console.log('\n🔐 Teste 3: Redefinindo senha...');
  
  const response = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Resposta:', data);
  
  return data.ok;
}

// Teste completo
async function runFullTest() {
  console.log('🧪 Iniciando testes de recuperação de senha...\n');
  console.log('⚠️  IMPORTANTE: Configure seu email no .env do servidor');
  console.log('    OU use Ethereal (modo de teste automático)\n');
  
  const testEmail = 'teste@example.com';
  
  try {
    // Etapa 1: Solicitar código
    const step1 = await testRequestCode(testEmail);
    if (!step1) {
      console.error('❌ Falha ao solicitar código');
      return;
    }
    console.log('✅ Código solicitado com sucesso!');
    
    // Aguardar entrada manual do código
    console.log('\n⏸️  Verifique seu email (ou console do servidor) e copie o código de 6 dígitos');
    console.log('   Para continuar o teste manualmente, use:');
    console.log(`   - Email: ${testEmail}`);
    console.log('   - Código: [o código recebido]');
    console.log('   - Nova senha: novaSenha123\n');
    
    // Para teste automatizado, você precisaria do código real
    // const testCode = '123456'; // Substitua pelo código real
    // const step2 = await testVerifyCode(testEmail, testCode);
    // if (!step2) {
    //   console.error('❌ Código inválido');
    //   return;
    // }
    // console.log('✅ Código verificado!');
    
    // const step3 = await testResetPassword(testEmail, testCode, 'novaSenha123');
    // if (!step3) {
    //   console.error('❌ Falha ao redefinir senha');
    //   return;
    // }
    // console.log('✅ Senha redefinida com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
  }
}

// Executar testes
runFullTest().catch(console.error);
