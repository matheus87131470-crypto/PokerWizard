#!/usr/bin/env node
/**
 * Complete test flow:
 * 1. Register user with 5 free uses
 * 2. Perform 5 analyses (consume all uses)
 * 3. Try 6th analysis (should block with 403)
 * 4. Create PIX payment
 * 5. Confirm PIX (activate premium)
 * 6. Verify premium status (usosRestantes = -1)
 * 7. Perform unlimited analyses
 */

const API_BASE = 'http://localhost:3000';

async function test() {
  console.log('\n=== POKERWIZARD FULL FLOW TEST ===\n');

  const email = `test_${Date.now()}@test.com`;
  const password = 'testpass123';
  const name = 'Test User';

  try {
    // 1. Register user
    console.log('1️⃣  Registrando usuário...');
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, price: 5.90 }),
    });
    const regData = await regRes.json();
    if (!regData.ok) throw new Error('Register failed: ' + JSON.stringify(regData));
    const token = regData.token;
    const userId = regData.user.id;
    console.log(`   ✓ Usuário criado: ${email}`);
    console.log(`   ✓ Usos iniciais: ${regData.user.usosRestantes}`);
    console.log(`   ✓ Status do plano: ${regData.user.statusPlano}`);
    if (regData.user.usosRestantes !== 5) throw new Error('Expected 5 uses but got ' + regData.user.usosRestantes);

    // 2. Perform 5 analyses
    console.log('\n2️⃣  Consumindo 5 usos com análises...');
    for (let i = 1; i <= 5; i++) {
      const analyzeRes = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ history: `Hand ${i}: blind levels 10/20, my stack 2000, ...` }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.ok) throw new Error(`Analyze ${i} failed: ` + JSON.stringify(analyzeData));
      console.log(`   ✓ Análise ${i} consumida. Usos restantes: ${analyzeData.remaining}`);
    }

    // 3. Try 6th analysis (should fail)
    console.log('\n3️⃣  Tentando 6ª análise (deve bloquear)...');
    const blockRes = await fetch(`${API_BASE}/api/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ history: 'Hand 6: ...' }),
    });
    if (blockRes.status !== 403) throw new Error(`Expected 403, got ${blockRes.status}`);
    const blockData = await blockRes.json();
    console.log(`   ✓ Bloqueado corretamente (403)`);
    console.log(`   ✓ Mensagem: ${blockData.message}`);
    console.log(`   ✓ Usos restantes: ${blockData.remaining}`);

    // 4. Create PIX payment
    console.log('\n4️⃣  Criando pagamento PIX...');
    const pixRes = await fetch(`${API_BASE}/api/payments/create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const pixData = await pixRes.json();
    if (!pixData.ok) throw new Error('Create PIX failed: ' + JSON.stringify(pixData));
    const paymentId = pixData.payment.id;
    console.log(`   ✓ PIX criado: ${paymentId}`);
    console.log(`   ✓ Valor: R$ ${pixData.payment.amount}`);

    // 5. Confirm PIX payment
    console.log('\n5️⃣  Confirmando pagamento PIX...');
    const confirmRes = await fetch(`${API_BASE}/api/payments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentId }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmData.ok) throw new Error('Confirm failed: ' + JSON.stringify(confirmData));
    console.log(`   ✓ Pagamento confirmado`);
    console.log(`   ✓ Status: ${confirmData.user.premium ? 'PREMIUM' : 'Free'}`);

    // 6. Fetch user info and verify premium
    console.log('\n6️⃣  Verificando status premium...');
    const meRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log(`   ✓ Status do plano: ${meData.user.statusPlano}`);
    console.log(`   ✓ Usos restantes: ${meData.user.usosRestantes === -1 ? 'ILIMITADO' : meData.user.usosRestantes}`);
    if (meData.user.statusPlano !== 'premium') throw new Error('Expected premium status');
    if (meData.user.usosRestantes !== -1) throw new Error('Expected unlimited uses (-1)');

    // 7. Try unlimited analyse (should work)
    console.log('\n7️⃣  Testando análises ilimitadas...');
    for (let i = 4; i <= 6; i++) {
      const analyzeRes = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ history: `Hand ${i}: premium analysis ...` }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.ok) throw new Error(`Premium analyze ${i} failed`);
      console.log(`   ✓ Análise ${i} (premium) ok. Remaining: ${analyzeData.remaining}`);
    }

    console.log('\n✅ TODOS OS TESTES PASSARAM!\n');
    console.log('Resumo:');
    console.log('  - Usuário criado com 5 usos gratuitos');
    console.log('  - 5 análises consumiram os 5 usos');
    console.log('  - 6ª tentativa foi bloqueada (403)');
    console.log('  - PIX criado e confirmado');
    console.log('  - Premium ativado com usos ilimitados');
    console.log('  - Análises ilimitadas funcionando\n');

  } catch (err) {
    console.error('\n❌ ERRO NO TESTE:', err.message, '\n');
    process.exit(1);
  }
}

test();
