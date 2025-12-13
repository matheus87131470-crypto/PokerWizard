# 🎯 Sistema de Treino GTO Completo - Documentação

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Motor de Poker** (`pokerEngine.ts`)
- ✅ Geração completa de deck (52 cartas)
- ✅ Embaralhamento Fisher-Yates
- ✅ Distribuição de mãos (2 cartas)
- ✅ Cartas comunitárias (Flop/Turn/River)
- ✅ Conversão para notação padrão (AKs, QQ, 72o)
- ✅ Avaliação de força da mão
- ✅ Detecção de suited/pocket pairs
- ✅ Formatação visual de cartas

### 2. **Ranges GTO** (`gtoRanges.ts`)
- ✅ Ranges de open-raise por posição (6-max)
  - UTG: ~15% (ranges tight)
  - HJ: ~20%
  - CO: ~30%
  - BTN: ~50% (ranges wide)
  - SB: ~35%
  - BB: Não tem open-raise
- ✅ Ranges de 3-bet para todas posições
- ✅ Ranges de 4-bet (simplificado)
- ✅ Avaliação de ações do usuário
- ✅ Feedback detalhado GTO
- ✅ Cálculo de equity estimada
- ✅ Explicações pedagógicas

### 3. **Sistema de Estatísticas** (`useTrainingStats.ts`)
- ✅ Tracking completo de mãos jogadas
- ✅ Precisão global e por posição
- ✅ Sistema de sequências (streak)
- ✅ Histórico de sessões
- ✅ Persistência em LocalStorage
- ✅ Duração da sessão
- ✅ Reset de estatísticas

### 4. **Interface de Treino** (`TrainingInterface.tsx`)
- ✅ 3 Modos de tela:
  - **Config**: Seleção de posição e parâmetros
  - **Training**: Jogo ativo com feedback
  - **Stats**: Visualização de estatísticas
- ✅ Display visual de cartas estilo casino
- ✅ Botões de ação (Raise/Call/Fold)
- ✅ Feedback instantâneo (correto/incorreto)
- ✅ Barra de stats em tempo real
- ✅ Navegação fluida entre modos

## 🎮 COMO FUNCIONA

### Fluxo de Treino

1. **Configuração**
   ```
   Usuário seleciona:
   - Posição na mesa (UTG, HJ, CO, BTN, SB, BB)
   - Solution (Cash/Tournament, stakes)
   - Starting Spot (Preflop/Flop/Turn/River)
   - Preflop Action (Any/SRP/3-bet/4-bet)
   ```

2. **Geração de Mão**
   ```typescript
   const situation = generateTrainingSituation(position, street);
   // Retorna:
   // - 2 cartas do jogador
   // - Cartas comunitárias (se aplicável)
   // - Notação da mão (ex: AKs)
   ```

3. **Decisão do Usuário**
   ```
   Usuário clica em:
   - RAISE 🚀
   - CALL 👍
   - FOLD 🚫
   ```

4. **Avaliação GTO**
   ```typescript
   const result = evaluateUserAction(action, hand, position, scenario);
   // Retorna:
   // - correct: true/false
   // - gtoAction: 'raise'|'call'|'fold'
   // - feedback: "Mensagem explicativa"
   // - score: 0-100
   ```

5. **Feedback Visual**
   ```
   ✅ Verde = Correto
   ❌ Vermelho = Incorreto
   + Explicação detalhada
   + Botão "Próxima Mão"
   ```

6. **Tracking**
   ```
   Estatísticas atualizadas automaticamente:
   - Total de mãos
   - Precisão (%)
   - Sequência atual
   - Melhor sequência
   - Stats por posição
   ```

## 📊 RANGES GTO IMPLEMENTADOS

### Open-Raise Ranges (Preflop)

**UTG (Under the Gun)** - 15%
```
Premium: AA, KK, QQ, JJ, TT, 99, 88, 77
Suited: AKs, AQs, AJs, ATs, A9s, A5s, A4s, KQs, KJs, KTs, QJs, QTs, JTs, T9s
Offsuit: AKo, AQo, AJo
```

**HJ (Hijack)** - 20%
```
Pockets: 55+
Suited Aces: A2s+
Suited Broadway: KQs, KJs, KTs, K9s, QJs, QTs, Q9s, JTs, J9s
Suited Connectors: T9s, T8s, 98s, 87s, 76s
Offsuit: AKo, AQo, AJo, ATo, KQo
```

**CO (Cutoff)** - 30%
```
Todos os pockets: 22+
Suited Aces: A2s+
Suited Kings: K5s+
Suited Queens: Q8s+
Suited Jacks: J8s+
Suited Connectors: 65s+
Offsuit: AKo-A8o, KQo-KTo, QJo, QTo, JTo
```

**BTN (Button)** - 50%
```
Muito wide - quase 50% das mãos
Inclui suited gappers, offsuit broadways, suited connectors
```

### 3-Bet Ranges

**Contra Open-Raise**
```
Value 3-bet: Premium hands (QQ+, AK)
Light 3-bet: Suited connectors, suited aces (balanceamento)
Call: Médias pocket pairs, suited connectors
Fold: Trash hands
```

## 💻 CÓDIGO DE EXEMPLO

### Usar o Motor de Poker
```typescript
import { createDeck, dealHand, handToNotation } from './services/pokerEngine';

// Criar e embaralhar deck
const deck = createDeck();

// Distribuir mão
const { hand, remainingDeck } = dealHand(deck);
console.log(hand); // [{ rank: 'A', suit: '♠', value: 14 }, ...]

// Converter para notação
const notation = handToNotation(hand);
console.log(notation); // "AKs"
```

### Avaliar Decisão GTO
```typescript
import { evaluateUserAction } from './services/gtoRanges';

const result = evaluateUserAction(
  'raise',        // Ação do usuário
  'AKs',          // Mão
  'BTN',          // Posição
  'open'          // Cenário
);

console.log(result.correct);    // true
console.log(result.feedback);   // "✅ Correto! RAISE é a jogada GTO..."
```

### Usar Estatísticas
```typescript
import { useTrainingStats } from './hooks/useTrainingStats';

function MyComponent() {
  const { stats, recordDecision, resetStats } = useTrainingStats();
  
  // Registrar decisão
  recordDecision(true, 'BTN', 100);
  
  // Ver stats
  console.log(stats.accuracy);      // 85.5
  console.log(stats.currentStreak); // 7
  console.log(stats.totalHands);    // 42
}
```

## 🎨 INTERFACE

### Tela de Configuração
```
┌─────────────────────────────────────┐
│   Poker Training Lab                │
│   Master GTO Strategy               │
├─────────────────────────────────────┤
│                                     │
│   [Mesa de Poker Interativa]        │
│   • Clique em posições (UTG-BB)     │
│   • Efeitos hover e seleção         │
│                                     │
├─────────────────────────────────────┤
│   Configurações:                    │
│   • Solution (Cash/Tournament)       │
│   • Starting Spot (Preflop/Flop)    │
│   • Preflop Action (Any/3-bet)      │
│                                     │
│   [🎯 Start Training]               │
└─────────────────────────────────────┘
```

### Tela de Treino
```
┌─────────────────────────────────────┐
│ Mãos: 15 | Precisão: 86.7% | ...   │
├─────────────────────────────────────┤
│   Posição: BTN                      │
│   Cash / 6max / NL500 | Preflop     │
│                                     │
│   Sua Mão:                          │
│   ┌────┐  ┌────┐                    │
│   │ A♠ │  │ K♦ │                    │
│   └────┘  └────┘                    │
│      AKs                            │
├─────────────────────────────────────┤
│   [🚀 RAISE]                        │
│   [👍 CALL]                         │
│   [🚫 FOLD]                         │
│                                     │
│   ✅ Correto!                       │
│   RAISE é a jogada GTO...           │
│   [Próxima Mão →]                   │
└─────────────────────────────────────┘
```

### Tela de Estatísticas
```
┌─────────────────────────────────────┐
│   📊 Estatísticas de Treino         │
├─────────────────────────────────────┤
│  Mãos    Precisão  Sequência  Melhor│
│   42      86.7%       7         12  │
├─────────────────────────────────────┤
│   Por Posição:                      │
│   BTN: 15 mãos (90% precisão)       │
│   CO:  12 mãos (83% precisão)       │
│   UTG: 8 mãos  (87% precisão)       │
├─────────────────────────────────────┤
│   Sessão: 25m                       │
│   [🔄 Resetar Estatísticas]         │
└─────────────────────────────────────┘
```

## 🚀 COMO TESTAR

1. **Iniciar servidor**
   ```bash
   .\start-pokerwizard.ps1
   ```

2. **Acessar**
   ```
   http://localhost:3000/training
   ```

3. **Testar fluxo completo**
   ```
   1. Selecionar BTN na mesa
   2. Escolher "Cash / 6max / NL500"
   3. Deixar "Preflop" e "Any"
   4. Clicar "Start Training"
   5. Receber mão aleatória
   6. Escolher ação (Raise/Call/Fold)
   7. Ver feedback GTO
   8. Clicar "Próxima Mão"
   9. Repetir várias vezes
   10. Ver estatísticas
   ```

## 📈 PRÓXIMAS MELHORIAS

### Fase 1 - Ranges Avançados
- [ ] Ranges de defesa vs 3-bet
- [ ] Ranges pós-flop (c-bet, check-raise)
- [ ] Ranges heads-up
- [ ] Import de ranges do GTO solver

### Fase 2 - Solver Integration
- [ ] Integração com PioSOLVER API
- [ ] Cálculo de equity real vs ranges
- [ ] Sugestões de frequências mistas
- [ ] Tree de decisões pós-flop

### Fase 3 - Features Premium
- [ ] Replay de mãos
- [ ] Exportar sessões para PDF
- [ ] Comparação com jogadores pros
- [ ] Challenges diários
- [ ] Ranking global

### Fase 4 - Multiplayer
- [ ] Treino vs IA
- [ ] Treino vs outros usuários
- [ ] Torneios de treino
- [ ] Leaderboards

## 🔧 ARQUITETURA

```
client/src/
├── components/
│   ├── TrainingInterface.tsx    # Componente principal
│   ├── PokerTable.tsx           # Mesa interativa
│   └── TrainingConfig.tsx       # Painel de configuração
├── services/
│   ├── pokerEngine.ts           # Motor de poker
│   └── gtoRanges.ts             # Ranges e avaliação GTO
├── hooks/
│   └── useTrainingStats.ts      # Hook de estatísticas
└── pages/
    └── (integração no App.tsx)
```

## 🎯 REGRAS GTO IMPLEMENTADAS

### Open-Raise
- Posições early (UTG, HJ): Ranges tight (15-20%)
- Posições late (CO, BTN): Ranges wide (30-50%)
- Considera suited/offsuit/pairs

### 3-Bet
- Value hands: QQ+, AK
- Light 3-bet: Suited aces low, suited connectors
- Call: Medium pairs, suited broadways
- Fold: Trash

### Feedback
- Correto: +100 pontos, streak +1
- Incorreto: 0 pontos, streak reset
- Feedback contextual baseado no erro

## 💾 PERSISTÊNCIA

Dados salvos em `localStorage`:
- `trainingStats`: Estatísticas da sessão atual
- `sessionHistory`: Últimas 50 sessões

## 🎓 PEDAGOGIA

O sistema ensina:
1. **Ranges de posição**: Quais mãos jogar de onde
2. **Frequências GTO**: Quando raise/call/fold
3. **Pensamento estratégico**: Por que cada ação
4. **Tracking de progresso**: Onde melhorar

---

**🎉 SISTEMA 100% FUNCIONAL E PRONTO PARA USO!**

Criado para PokerWizard PRO - Training Lab
Data: 10/12/2025
