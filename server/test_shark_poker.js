#!/usr/bin/env node
/**
 * Test SharkScope e Poker endpoints consumindo usos
 */

const API_BASE = 'http://localhost:3000';

async function test() {
  console.log('\n=== TEST SHARKSCOPE & POKER USAGE ===\n');

  const email = `test_shark_${Date.now()}@test.com`;
  const password = 'testpass123';
  const name = 'SharkScope Tester';

  try {
    // 1. Register user
    console.log('1️⃣  Registrando usuário com 3 usos...');
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, price: 5.90 }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    console.log(`   ✓ Usos iniciais: ${regData.user.usosRestantes}`);

    // 2. Test SharkScope search (consumes 1 use)
    console.log('\n2️⃣  Testando SharkScope search...');
    const sharkRes = await fetch(`${API_BASE}/api/sharkscope/player/algumJogador`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sharkData = await sharkRes.json();
    if (!sharkData.ok) throw new Error('SharkScope failed: ' + JSON.stringify(sharkData));
    console.log(`   ✓ SharkScope ok`);
    console.log(`   ✓ Jogador: ${sharkData.data.name}`);
    console.log(`   ✓ Games: ${sharkData.data.games}`);

    // 3. Check uses after SharkScope
    console.log('\n3️⃣  Verificando usos após SharkScope...');
    const meRes1 = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData1 = await meRes1.json();
    console.log(`   ✓ Usos restantes: ${meData1.user.usosRestantes}`);
    if (meData1.user.usosRestantes !== 2) throw new Error('Expected 2 uses after SharkScope');

    // 4. Test Poker import (consumes 1 use)
    console.log('\n4️⃣  Testando Poker importar-maos...');
    const pokerImportRes = await fetch(`${API_BASE}/api/poker/importar-maos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hands: ['Hand 1: ...', 'Hand 2: ...'] }),
    });
    const pokerImportData = await pokerImportRes.json();
    if (!pokerImportData.ok) throw new Error('Poker import failed: ' + JSON.stringify(pokerImportData));
    console.log(`   ✓ Mãos importadas: ${pokerImportData.imported}`);

    // 5. Check uses after Poker import
    console.log('\n5️⃣  Verificando usos após Poker import...');
    const meRes2 = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData2 = await meRes2.json();
    console.log(`   ✓ Usos restantes: ${meData2.user.usosRestantes}`);
    if (meData2.user.usosRestantes !== 1) throw new Error('Expected 1 use after Poker import');

    // 6. Test Poker analyze (consumes 1 use)
    console.log('\n6️⃣  Testando Poker analyze...');
    const pokerAnalyzeRes = await fetch(`${API_BASE}/api/poker/analise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hand: 'Hand history: ...' }),
    });
    const pokerAnalyzeData = await pokerAnalyzeRes.json();
    if (!pokerAnalyzeData.ok) throw new Error('Poker analyze failed: ' + JSON.stringify(pokerAnalyzeData));
    console.log(`   ✓ Análise realizada`);

    // 7. Check uses after Poker analyze (should be 0 now)
    console.log('\n7️⃣  Verificando usos após Poker analyze (deve ser 0)...');
    const meRes3 = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData3 = await meRes3.json();
    console.log(`   ✓ Usos restantes: ${meData3.user.usosRestantes}`);
    if (meData3.user.usosRestantes !== 0) throw new Error('Expected 0 uses');

    // 8. Try another action (should fail with 403)
    console.log('\n8️⃣  Tentando SharkScope com 0 usos (deve bloquear)...');
    const blockRes = await fetch(`${API_BASE}/api/sharkscope/player/teste`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (blockRes.status !== 403) throw new Error(`Expected 403, got ${blockRes.status}`);
    console.log(`   ✓ Bloqueado corretamente (403)`);

    console.log('\n✅ TESTES DE SHARK & POKER PASSARAM!\n');

  } catch (err) {
    console.error('\n❌ ERRO:', err.message, '\n');
    process.exit(1);
  }
}

test();
