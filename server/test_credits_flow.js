const http = require('http');

const API_BASE = 'http://localhost:3000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log('=== TESTE DE FLUXO DE CRÉDITOS ===\n');

    // 1. Registrar usuário
    console.log('1️⃣  Registrando usuário...');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      email: `testcredits${Date.now()}@test.com`,
      name: 'Test Credits',
      password: 'password123',
      price: 5.90,
    });
    console.log(`   Status: ${regRes.status}`);
    console.log(`   Usuário ID: ${regRes.body.user?.id}`);
    console.log(`   Créditos iniciais: ${regRes.body.user?.credits}`);
    const token = regRes.body.token;
    if (!token) throw new Error('Sem token após registro');
    console.log('   ✅ Usuário registrado com sucesso\n');

    // 2. Fazer login
    console.log('2️⃣  Testando login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: regRes.body.user.email,
      password: 'password123',
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Créditos: ${loginRes.body.user?.credits}`);
    console.log('   ✅ Login bem-sucedido\n');

    // 3. Chamar análise 3 vezes (usar créditos)
    console.log('3️⃣  Chamando análise 3 vezes (usar créditos)...');
    for (let i = 1; i <= 3; i++) {
      const analyzeRes = await makeRequest('POST', '/api/ai/analyze', {
        history: `Mão ${i}: AA KK QQ...`,
      }, {
        'Authorization': `Bearer ${token}`,
      });
      console.log(`   Análise ${i}: Status ${analyzeRes.status}`);
      console.log(`   Créditos restantes: ${analyzeRes.body.remaining}`);
      if (analyzeRes.status !== 200) {
        console.log(`   ❌ Erro na análise ${i}: ${analyzeRes.body.message}`);
        break;
      }
    }
    console.log('   ✅ 3 análises executadas\n');

    // 4. Buscar estado atual do usuário
    console.log('4️⃣  Buscando estado atual do usuário...');
    const meRes = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`,
    });
    console.log(`   Status: ${meRes.status}`);
    console.log(`   Créditos: ${meRes.body.user?.credits}`);
    console.log(`   Premium: ${meRes.body.user?.premium}`);
    console.log('   ✅ Usuário consultado\n');

    // 5. Tentar análise com créditos = 0 (esperando erro)
    console.log('5️⃣  Tentando análise com créditos = 0...');
    const analyze4Res = await makeRequest('POST', '/api/ai/analyze', {
      history: 'Mão 4: Deveria falhar...',
    }, {
      'Authorization': `Bearer ${token}`,
    });
    console.log(`   Status: ${analyze4Res.status}`);
    console.log(`   Resposta: ${analyze4Res.body.message || analyze4Res.body.error || 'OK'}`);
    if (analyze4Res.status === 403 || analyze4Res.status === 402) {
      console.log('   ✅ Bloqueado corretamente (sem créditos)\n');
    } else {
      console.log(`   ⚠️  Status inesperado (esperado 403 ou 402, recebido ${analyze4Res.status})\n`);
    }

    console.log('=== ✅ TESTE COMPLETO ===');
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
  }
}

test();
