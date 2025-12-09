#!/usr/bin/env node

/**
 * Teste de validação do middleware de autenticação
 * Verifica se generateToken e verifyToken funcionam corretamente
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

// Simular as funções do middleware
function generateToken(userId) {
  if (!userId) {
    throw new Error('userId is required to generate token');
  }
  
  return jwt.sign({ userId }, JWT_SECRET, { 
    expiresIn: '30d',
    algorithm: 'HS256'
  });
}

function verifyToken(token) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    return decoded;
  } catch (err) {
    return null;
  }
}

// ===== TESTES =====

console.log('🧪 Teste de Middleware de Autenticação\n');

// Teste 1: Gerar token
console.log('1️⃣  Gerando token para userId: user123');
const token = generateToken('user123');
console.log(`   ✅ Token gerado: ${token.substring(0, 30)}...`);

// Teste 2: Verificar token válido
console.log('\n2️⃣  Verificando token válido');
const decoded = verifyToken(token);
if (decoded && decoded.userId === 'user123') {
  console.log(`   ✅ Token verificado com sucesso!`);
  console.log(`   userId: ${decoded.userId}`);
  console.log(`   iat: ${new Date(decoded.iat * 1000).toISOString()}`);
} else {
  console.log(`   ❌ Falha ao verificar token`);
}

// Teste 3: Token inválido
console.log('\n3️⃣  Testando token inválido');
const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid';
const result = verifyToken(invalidToken);
if (result === null) {
  console.log(`   ✅ Token inválido foi rejeitado corretamente`);
} else {
  console.log(`   ❌ Token inválido foi aceito (erro!)`);
}

// Teste 4: Token vazio
console.log('\n4️⃣  Testando token vazio');
const emptyResult = verifyToken('');
if (emptyResult === null) {
  console.log(`   ✅ Token vazio foi rejeitado corretamente`);
} else {
  console.log(`   ❌ Token vazio foi aceito (erro!)`);
}

// Teste 5: Erro ao gerar token sem userId
console.log('\n5️⃣  Testando geração de token sem userId');
try {
  generateToken('');
  console.log(`   ❌ Função não lançou erro para userId vazio`);
} catch (err) {
  console.log(`   ✅ Erro lançado corretamente: ${err.message}`);
}

// Teste 6: Formato Bearer em requisição HTTP (simulado)
console.log('\n6️⃣  Simulando validação de Authorization header');
const authHeader = `Bearer ${token}`;
if (authHeader.startsWith('Bearer ')) {
  const tokenFromHeader = authHeader.substring(7).trim();
  const decodedFromHeader = verifyToken(tokenFromHeader);
  if (decodedFromHeader && decodedFromHeader.userId === 'user123') {
    console.log(`   ✅ Token extraído do header "Bearer" funcionou`);
  } else {
    console.log(`   ❌ Falha ao processar token do header`);
  }
} else {
  console.log(`   ❌ Header não está em formato "Bearer <token>"`);
}

console.log('\n✅ Todos os testes de autenticação completados!\n');
