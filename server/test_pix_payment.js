#!/usr/bin/env node

/**
 * TESTE DE PAGAMENTO PIX
 * 
 * Script para testar o fluxo de pagamento PIX
 * Simula um pagamento sendo confirmado após o usuário clicar em "Já paguei"
 */

const API_BASE = 'http://localhost:3000';

// ======= CONFIGURAÇÃO =======
let TOKEN = ''; // Será preenchido após login
let PAYMENT_ID = ''; // Será preenchido após criar PIX
const EMAIL = `test_${Date.now()}@test.com`;
const PASSWORD = 'Test123@456';

// ======= FUNÇÕES =======

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` }),
    },
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`Erro ao parsear resposta: ${text.substring(0, 100)}`);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  console.log('\n=== TESTE DE PAGAMENTO PIX ===\n');
  
  try {
    // 1. Registrar novo usuário
    console.log('1️⃣  Registrando usuário...');
    const registerRes = await request('POST', '/api/auth/register', {
      email: EMAIL,
      password: PASSWORD,
      name: 'Test User',
    });
    console.log(`   ✅ Usuário criado: ${registerRes.user.email}`);
    TOKEN = registerRes.token;
    
    // 2. Verificar status inicial (deve ter 3 créditos)
    console.log('\n2️⃣  Verificando créditos iniciais...');
    const creditsRes = await request('GET', '/api/credits');
    console.log(`   ✅ Créditos: ${creditsRes.freeAnalyses} (Premium: ${creditsRes.isPremium})`);
    
    // 3. Criar pagamento PIX
    console.log('\n3️⃣  Criando pagamento PIX...');
    const pixRes = await request('POST', '/api/payments/create-pix');
    console.log(`   ✅ PIX criado:`);
    console.log(`      ID: ${pixRes.payment.id}`);
    console.log(`      Valor: R$ ${(pixRes.payment.amount / 100).toFixed(2)}`);
    console.log(`      QR Code: https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(pixRes.payment.brCode)}`);
    PAYMENT_ID = pixRes.payment.id;
    
    // 4. Simular pagamento (webhook ou confirmação manual)
    console.log('\n4️⃣  Simulando confirmação de pagamento...');
    console.log(`   ⏳ Aguardando ${3}s...`);
    await sleep(3000);
    
    const confirmRes = await request('POST', '/api/payments/confirm', {
      paymentId: PAYMENT_ID,
    });
    console.log(`   ✅ Pagamento confirmado!`);
    console.log(`      Mensagem: ${confirmRes.message}`);
    console.log(`      Premium: ${confirmRes.user.premium}`);
    
    // 5. Verificar novo status
    console.log('\n5️⃣  Verificando novo status...');
    const newCreditsRes = await request('GET', '/api/credits');
    console.log(`   ✅ Créditos agora: ${newCreditsRes.freeAnalyses} (Premium: ${newCreditsRes.isPremium})`);
    
    if (newCreditsRes.isPremium) {
      console.log('\n✅ TESTE PASSOU! Premium ativado com sucesso!\n');
    } else {
      console.log('\n❌ TESTE FALHOU! Premium não foi ativado.\n');
    }
    
  } catch (err) {
    console.error(`\n❌ ERRO: ${err.message}\n`);
    process.exit(1);
  }
}

// ======= EXECUÇÃO =======
console.log('Iniciando testes...');
console.log(`API: ${API_BASE}\n`);

test().catch(console.error);
