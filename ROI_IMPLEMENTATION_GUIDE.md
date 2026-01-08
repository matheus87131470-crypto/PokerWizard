# Sistema ROI - Guia de Implementação

## ✅ Implementação Completa

### 1️⃣ Estrutura do Banco de Dados (PostgreSQL)

**Tabela: `tournament_sessions`**
```sql
CREATE TABLE tournament_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  tipo_jogo VARCHAR(10) NOT NULL CHECK (tipo_jogo IN ('MTT', 'SNG')),
  buy_in DECIMAL(10,2) NOT NULL CHECK (buy_in > 0),
  premio DECIMAL(10,2) NOT NULL DEFAULT 0,
  data TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tournament_sessions_user ON tournament_sessions(user_id);
CREATE INDEX idx_tournament_sessions_date ON tournament_sessions(data);
```

**Campos:**
- `id`: UUID único da sessão
- `user_id`: ID do usuário (FK para tabela users)
- `tipo_jogo`: 'MTT' ou 'SNG' (cash games não entram no ROI)
- `buy_in`: Valor de entrada (>0)
- `premio`: Valor do prêmio (pode ser 0)
- `data`: Data/hora do torneio
- `created_at`: Data de criação do registro

---

## 2️⃣ Endpoints da API

### **GET /api/roi**
Obter ROI do usuário autenticado

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta de sucesso (200):**
```json
{
  "roi": 25.50,
  "total_buyins": 1000.00,
  "total_premios": 1255.00,
  "num_torneios": 15
}
```

**Resposta sem dados:**
```json
{
  "roi": null,
  "total_buyins": 0,
  "total_premios": 0,
  "num_torneios": 0,
  "message": "Nenhum torneio registrado ainda"
}
```

**Cálculo:**
```
ROI = ((total_premios - total_buyins) / total_buyins) × 100
```

---

### **POST /api/roi/sessions**
Criar nova sessão de torneio

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "tipo_jogo": "MTT",
  "buy_in": 50.00,
  "premio": 150.00,
  "data": "2026-01-07T20:30:00Z"
}
```

**Campos:**
- `tipo_jogo`: "MTT" ou "SNG" (obrigatório)
- `buy_in`: Valor de entrada em R$ (obrigatório, >0)
- `premio`: Valor do prêmio em R$ (obrigatório, pode ser 0)
- `data`: ISO timestamp (opcional, default: agora)

**Resposta (200):**
```json
{
  "success": true,
  "session": {
    "id": "abc123...",
    "tipo_jogo": "MTT",
    "buy_in": 50.00,
    "premio": 150.00,
    "data": "2026-01-07T20:30:00.000Z"
  }
}
```

**Erros:**
- `400`: Validação falhou (tipo_jogo inválido, buy_in <= 0, etc)
- `401`: Token inválido ou ausente
- `500`: Erro no servidor

---

### **GET /api/roi/sessions**
Listar sessões de torneio do usuário

**Headers:**
```
Authorization: Bearer {token}
```

**Query params:**
```
?limit=50  (opcional, default: 50)
```

**Resposta (200):**
```json
{
  "sessions": [
    {
      "id": "abc123",
      "tipo_jogo": "MTT",
      "buy_in": 50.00,
      "premio": 150.00,
      "lucro": 100.00,
      "data": "2026-01-07T20:30:00.000Z",
      "created_at": "2026-01-07T20:45:00.000Z"
    },
    {
      "id": "def456",
      "tipo_jogo": "SNG",
      "buy_in": 20.00,
      "premio": 0,
      "lucro": -20.00,
      "data": "2026-01-06T18:00:00.000Z",
      "created_at": "2026-01-06T19:00:00.000Z"
    }
  ]
}
```

---

### **DELETE /api/roi/sessions/:id**
Deletar uma sessão de torneio

**Headers:**
```
Authorization: Bearer {token}
```

**URL param:**
```
:id - UUID da sessão
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Sessão deletada com sucesso"
}
```

---

## 3️⃣ Integração Frontend

### **Serviço ROI (roiService.ts)**

```typescript
import { fetchUserROI } from '../services/roiService';

// No componente
const [roiData, setRoiData] = useState<ROIData | null>(null);

useEffect(() => {
  const loadROI = async () => {
    try {
      const data = await fetchUserROI();
      setRoiData(data);
    } catch (error) {
      console.error('Erro ao carregar ROI:', error);
    }
  };
  
  loadROI();
}, []);

// Exibir no UI
{roiData?.roi !== null ? (
  <div>{roiData.roi.toFixed(1)}%</div>
) : (
  <div>Em breve</div>
)}
```

### **Criar Sessão**

```typescript
import { createTournamentSession } from '../services/roiService';

const handleAddTournament = async () => {
  try {
    await createTournamentSession({
      tipo_jogo: 'MTT',
      buy_in: 50,
      premio: 150,
      data: new Date().toISOString()
    });
    
    // Recarregar ROI
    const newROI = await fetchUserROI();
    setRoiData(newROI);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

## 4️⃣ Exemplos de Uso

### **Exemplo 1: Jogador ganhou um MTT**
```bash
POST /api/roi/sessions
{
  "tipo_jogo": "MTT",
  "buy_in": 100.00,
  "premio": 500.00
}

# ROI = ((500 - 100) / 100) × 100 = 400%
```

### **Exemplo 2: Jogador perdeu um SNG**
```bash
POST /api/roi/sessions
{
  "tipo_jogo": "SNG",
  "buy_in": 50.00,
  "premio": 0
}

# ROI = ((0 - 50) / 50) × 100 = -100%
```

### **Exemplo 3: Múltiplos torneios**
```
Torneio 1: buy-in 50, prêmio 150 → lucro +100
Torneio 2: buy-in 50, prêmio 0   → lucro -50
Torneio 3: buy-in 100, prêmio 80 → lucro -20

Total buy-ins: 200
Total prêmios: 230
Lucro: 30

ROI = (30 / 200) × 100 = 15%
```

---

## 5️⃣ Regras de Negócio

### ✅ O que conta no ROI:
- Torneios MTT (Multi-Table Tournament)
- Torneios SNG (Sit & Go)
- Com buy-in > 0

### ❌ O que NÃO conta no ROI:
- Cash games (CASH)
- Sessões sem tipo especificado
- Sessões com buy-in = 0 ou não informado

### 📊 Exibição:
- **ROI**: Verde (positivo), Vermelho (negativo), Roxo (neutro/zero)
- **Buy-ins totais**: Sempre em R$
- **Nº de torneios**: Contador simples
- **Estado "Em breve"**: Aparece quando num_torneios = 0

---

## 6️⃣ Testes

### **Testar criação de sessão:**
```bash
curl -X POST http://localhost:3000/api/roi/sessions \
  -H "Authorization: Bearer {seu_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_jogo": "MTT",
    "buy_in": 50,
    "premio": 150
  }'
```

### **Testar obtenção de ROI:**
```bash
curl -X GET http://localhost:3000/api/roi \
  -H "Authorization: Bearer {seu_token}"
```

### **Testar listagem:**
```bash
curl -X GET http://localhost:3000/api/roi/sessions?limit=10 \
  -H "Authorization: Bearer {seu_token}"
```

---

## 7️⃣ Migrações

A tabela é criada automaticamente ao iniciar o servidor via:
```typescript
await initDatabase(); // em server/src/index.ts
```

Se precisar criar manualmente:
```sql
-- Conectar ao PostgreSQL
psql $DATABASE_URL

-- Criar tabela
\i migration_roi.sql

-- Verificar
SELECT * FROM tournament_sessions;
```

---

## 8️⃣ Segurança

- ✅ Autenticação via JWT obrigatória
- ✅ Filtro por user_id automático
- ✅ Validação de tipos e valores
- ✅ Proteção contra SQL injection (prepared statements)
- ✅ CASCADE DELETE (ao deletar usuário, remove suas sessões)

---

## 9️⃣ Performance

- ✅ Índices criados em `user_id` e `data`
- ✅ Query otimizada com SUM/COUNT
- ✅ Limite padrão de 50 sessões na listagem
- ✅ Pool de conexões PostgreSQL (max: 10)

---

## 🔟 Troubleshooting

### Erro: "DATABASE_URL não configurada"
```bash
# Adicionar no .env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### ROI não aparece no frontend
1. Verificar se token está válido
2. Verificar console do navegador (erros de CORS?)
3. Testar endpoint diretamente com curl
4. Verificar se há torneios cadastrados

### Sessões não salvam no banco
1. Verificar se gameType === 'MTT' ou 'SNG'
2. Verificar se buyin > 0
3. Verificar logs do servidor
4. Testar com curl direto na API

---

## 📚 Arquivos Modificados

```
✅ server/src/services/database.ts     - Tabela + funções CRUD
✅ server/src/routes/roi.ts            - Endpoints da API
✅ server/src/index.ts                 - Registro da rota
✅ client/src/services/roiService.ts   - Serviço frontend
✅ client/src/pages/History.tsx        - Exibição de ROI
✅ client/src/pages/ResultsTracker.tsx - Criação de sessões
```

---

## 🎯 Status: IMPLEMENTADO ✅

Todos os requisitos foram atendidos:
- ✅ Estrutura PostgreSQL
- ✅ Endpoints REST completos
- ✅ Cálculo de ROI correto
- ✅ Apenas MTT/SNG (cash excluído)
- ✅ Integração frontend
- ✅ Compatibilidade com sessões antigas
- ✅ Segurança e validações
