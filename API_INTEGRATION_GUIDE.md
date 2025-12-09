# Guia de Integração de APIs de Poker

## Status Atual
✅ Sistema de Análise com IA funcionando com dados MOCK
✅ Frontend preparado para integração com APIs reais
✅ Backend pronto para receber dados reais

## Como Integrar APIs Reais

### 1. SharkScope API
**Local de Integração:** `server/src/services/sharkscopeService.ts`

```typescript
// Função atual (mock):
export async function fetchPlayerFromSharkScope(name: string) {
  // Retorna dados mock
}

// Função real (quando integrado):
export async function fetchPlayerFromSharkScope(name: string) {
  const key = process.env.SHARKSCOPE_API_KEY;
  const res = await fetch('https://api.sharkscope.com/v1/player', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'User-Agent': 'PokerWizard',
    },
    body: JSON.stringify({ player_name: name }),
  });
  return res.json();
}
```

**Endpoints Necessários:**
- GET `/api/sharkscope/search?name=Matheusac7&site=pokerstars` → Retorna stats do jogador
- GET `/api/sharkscope/tournament/:id` → Histórico de torneios

### 2. PokerStars API
**Local de Integração:** `server/src/routes/sharkscope.ts` (linha 14)

```typescript
// Adicione após deductCredit:
if (site === 'pokerstars') {
  data = await fetchFromPokerStars(name);
} else if (site === 'sharkscope') {
  data = await fetchPlayerFromSharkScope(name);
}
```

### 3. Party Poker / 888poker / Betfair
Usar mesma estrutura com rotas `router.post('/search')` separadas

---

## Fluxo Atual (Mock com IA)

```
Frontend: Buscar "Matheusac7"
   ↓
Backend: POST /api/sharkscope/search
   ↓
generateMockPlayerData() → Gera dados aleatórios realistas
   ↓
IA Analisa os dados → Cria insights, recomendações
   ↓
Frontend: Exibe 7 abas com dados analisados
```

---

## Fluxo Quando Integrar API Real

```
Frontend: Buscar "Matheusac7"
   ↓
Backend: fetchPlayerFromSharkScope(name)
   ↓
API Real (SharkScope) → Retorna dados reais do jogador
   ↓
Backend: Salva em cache, deduz crédito do usuário
   ↓
IA Analisa os dados reais → Insights mais precisos
   ↓
Frontend: Exibe tudo com dados reais
```

---

## Variáveis de Ambiente Necessárias

Adicione ao `.env`:

```env
# SharkScope
SHARKSCOPE_API_KEY=your_key_here
SHARKSCOPE_API_URL=https://api.sharkscope.com/v1

# PokerStars (se aplicável)
POKERSTARS_API_KEY=your_key_here

# Party Poker
PARTYPOKER_API_KEY=your_key_here

# 888poker
POKER888_API_KEY=your_key_here
```

---

## Testes

### Teste com Dados Mock (Atual)
```bash
# O frontend já está funcionando
# Basta abrir http://localhost:5173
# E buscar qualquer jogador (ex: "Matheusac7")
```

### Teste com API Real (Futuro)
```bash
# 1. Adicione chaves de API no .env
# 2. Remova "generateMockPlayerData" do frontend
# 3. Ative o comentário em analysisService.ts:
#    const res = await fetch(`${API_BASE}/api/sharkscope/search`, ...)

# 4. Reinicie servidor
npm run dev

# 5. Teste novamente
```

---

## Abas Suportadas

| Aba | Dados | IA? |
|-----|-------|-----|
| 📊 Gráficos | VPIP, PFR, Aggression Factor | ✅ |
| 🏆 Torneios | ROI, ITM, Lucro | ✅ (deduz crédito) |
| 📈 Desmembramento | Total mãos, distribuição | ✅ |
| 📊 Estatísticas | Stats detalhadas | ✅ |
| 🎖️ Conquistas | Badges por desempenho | ✅ |
| 💡 Intuições | Improvements & Leaks | ✅ (IA gera) |
| 📄 Relatórios | Análise completa | ✅ (IA gera) |

---

## Sistema de Créditos

- **Cada busca = 1 crédito**
- **Gratuito:** 3 créditos
- **Premium:** Ilimitado
- **Deduído em:** `server/src/routes/sharkscope.ts:17` (deductCredit call)

---

## Notas Importantes

1. **Quando você integrar a API real**, mude em `client/src/pages/Analysis.tsx`:
   - Descomente a chamada fetch comentada (linha ~105)
   - Remova a função `generateMockPlayerData()`

2. **O sistema deduz crédito automaticamente** na rota backend

3. **A IA já está 100% funcional** - só precisa dos dados reais

4. **Cache pode ser implementado em** `server/src/services/sharkscopeService.ts`

---

Pronto para integrar quando tiver as chaves de API! 🚀
