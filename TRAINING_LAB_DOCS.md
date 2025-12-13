# Training Lab - Interface de Treino GTO

## 📋 Visão Geral

Interface moderna de treino de poker inspirada no GTO Wizard, com design dark mode e elementos interativos.

## 🎨 Componentes Criados

### 1. **TrainingInterface.tsx** (Componente Principal)
- Layout responsivo com grid 2 colunas
- Gerenciamento de estado para configurações
- Integração entre mesa e painel de configuração

### 2. **PokerTable.tsx** (Mesa de Poker)
- **Posições interativas**: UTG, HJ, CO, BTN, SB, BB
- **Visual**:
  - Feltro verde realista com borda dourada
  - Círculos para cada posição com efeitos hover
  - Linhas pontilhadas conectando posições
  - Área central para cartas comunitárias
  - Indicador de pot
- **Interatividade**:
  - Clique para selecionar posição
  - Animação de pulso na posição selecionada
  - Efeito de brilho em hover

### 3. **TrainingConfig.tsx** (Painel de Configuração)
- **Seções**:
  - **Solution**: Seleção de formato (Cash/Tournament, stakes)
  - **Starting Spot**: Preflop, Flop, Turn, River, Custom
  - **Preflop Action**: Any, SRP, 3-bet, 4-bet, 5-bet+, Limp, vs Limp
- **Features**:
  - Botões com estados selecionado/hover
  - Box de resumo da configuração
  - Botão "Start Training" com gradiente
  - Quick tips para guiar o usuário

## 🎯 Funcionalidades

### Seleção de Posição
- Clique em qualquer posição (UTG, HJ, CO, BTN, SB, BB)
- Feedback visual imediato com gradiente azul/roxo
- Indicador de check mark na posição selecionada

### Configuração de Treino
- **Solutions disponíveis**:
  - Cash / 6max / NL500
  - Cash / 6max / NL200
  - Cash / 6max / NL100
  - Cash / 9max / NL500
  - Tournament / Early
  - Tournament / Middle
  - Tournament / Bubble

- **Starting Spots**:
  - Preflop
  - Flop
  - Turn
  - River
  - Custom

- **Preflop Actions** (quando Preflop selecionado):
  - Any
  - SRP (Single Raised Pot)
  - 3-bet
  - 4-bet
  - 5-bet+
  - Limp
  - vs Limp

### Botão Start Training
- Log no console com configuração selecionada
- Pronto para integração com lógica de treino

## 🎨 Design System

### Cores
```css
--training-gradient-1: #00d4ff (Azul Cyan)
--training-gradient-2: #7b2cbf (Roxo)
--poker-green: #1a4d2e (Verde Feltro)
--poker-green-dark: #0f3d26 (Verde Escuro)
--gold-accent: #ffd700 (Dourado)
```

### Gradientes
- **Principal**: `linear-gradient(135deg, #00d4ff, #7b2cbf)`
- **Background**: `linear-gradient(135deg, #0f0f23, #1a1a2e)`
- **Feltro**: `linear-gradient(135deg, #1a4d2e, #0f3d26)`

### Efeitos
- **Blur**: `backdrop-filter: blur(10px)`
- **Sombras**: Box-shadow com rgba para profundidade
- **Animações**: Pulso, hover transitions, scale transforms

## 📁 Estrutura de Arquivos

```
client/src/
├── components/
│   ├── TrainingInterface.tsx  # Componente principal
│   ├── PokerTable.tsx         # Mesa com posições
│   └── TrainingConfig.tsx     # Painel de configuração
├── App.tsx                    # Rota /training adicionada
└── styles.css                 # Variáveis CSS atualizadas
```

## 🚀 Como Usar

1. **Acesse a interface**:
   ```
   http://localhost:3000/training
   ```

2. **Selecione uma posição** na mesa (ex: BTN)

3. **Configure o treino**:
   - Escolha o formato (Cash/Tournament)
   - Selecione o starting spot
   - Se preflop, escolha a ação

4. **Clique em "Start Training"**
   - Atualmente loga a configuração no console
   - Pronto para integrar lógica de treino

## 🔧 Próximas Implementações

### Fase 1: Lógica de Poker
- [ ] Gerador de mãos aleatórias
- [ ] Calculadora de ranges
- [ ] Sistema de soluções GTO

### Fase 2: Interface Interativa
- [ ] Mostrar cartas do jogador
- [ ] Opções de ação (Fold, Call, Raise)
- [ ] Feedback em tempo real

### Fase 3: Estatísticas
- [ ] Tracking de acertos/erros
- [ ] Histórico de treinos
- [ ] Gráficos de progresso

### Fase 4: Conteúdo
- [ ] Banco de dados de soluções
- [ ] Integração com solver
- [ ] Explicações de jogadas

## 💡 Dicas de Customização

### Adicionar novas posições
```typescript
const positions: Position[] = [
  { id: 'UTG', label: 'UTG', x: 50, y: 70, angle: 180 },
  // Adicione mais...
];
```

### Adicionar novos solutions
```typescript
const solutions = [
  'Cash / 6max / NL500',
  'Seu novo formato aqui',
];
```

### Modificar cores
Edite as variáveis CSS em `styles.css`:
```css
--training-gradient-1: #sua-cor;
--training-gradient-2: #sua-cor;
```

## 🎮 Comportamento Atual

### Console Log ao Iniciar Treino:
```javascript
{
  solution: "Cash / 6max / NL500",
  spot: "Preflop",
  action: "Any",
  position: "BTN"
}
```

## 📱 Responsividade

- **Desktop**: Grid 2 colunas (mesa + config)
- **Tablet**: Ajuste automático de larguras
- **Mobile**: Stack vertical (implementar futuramente)

## 🔐 Integração com Auth

- Interface disponível para todos usuários
- Futuro: Limitar treinos por plano (Free/Premium)
- Tracking de uso já preparado

## ✅ Checklist de Qualidade

- [x] Design dark mode profissional
- [x] Animações suaves e responsivas
- [x] Código TypeScript tipado
- [x] Componentes modulares e reutilizáveis
- [x] Estados gerenciados corretamente
- [x] Feedback visual em todas interações
- [x] Código limpo e comentado
- [x] Pronto para expansão

---

**Desenvolvido para PokerWizard PRO** 🃏♠️♥️♦️♣️
