# 🎯 Como Ativar o ROI e Remover "Em breve"

## ⚡ Opção 1: Popular com Dados de Demonstração (Mais Rápido)

### Passo 1: Descobrir seu email de usuário
```powershell
# Veja no console do navegador (F12) qual email você está usando
# Ou veja em localStorage:
localStorage.getItem('user')
```

### Passo 2: Popular dados de teste
```powershell
cd server
npm run seed-roi usuario@email.com
```

Isso vai criar **15 torneios de exemplo** com:
- 7 MTT (Multi-Table Tournaments)
- 8 SNG (Sit & Go)
- Buy-ins variados (R$ 20 a R$ 200)
- ROI positivo (~20-30%)

### Passo 3: Atualizar a página
Recarregue a página do Histórico (F5) e verá:
- ✅ ROI calculado (verde se positivo, vermelho se negativo)
- ✅ Buy-ins totais
- ✅ Número de torneios

---

## 🎮 Opção 2: Adicionar Torneios Manualmente

### Passo 1: Ir para Controle de Resultados
Navegue para: `/results-tracker`

### Passo 2: Adicionar sessões com tipo de jogo
1. **Ganhos**: Digite o prêmio que ganhou (ex: 150)
2. **Perdas**: Digite 0 se ganhou, ou deixe vazio
3. **Tipo de Jogo**: Selecione **MTT** ou **SNG**
4. **Buy-in do Torneio**: Digite o valor da entrada (ex: 50)
5. Clique em "Adicionar Sessão"

### Exemplo prático:
```
Sessão 1 (Você ganhou um torneio):
- Ganhos: R$ 200
- Perdas: R$ 0
- Tipo: MTT
- Buy-in: R$ 50
= Lucro de R$ 150

Sessão 2 (Você perdeu):
- Ganhos: R$ 0
- Perdas: R$ 0
- Tipo: MTT
- Buy-in: R$ 50
= Prejuízo de R$ 50 (só perde o buy-in)

ROI = ((200 - 100) / 100) × 100 = 100%
```

### Passo 3: Ver o ROI
Vá para `/history` e veja as métricas calculadas automaticamente!

---

## 🧪 Opção 3: Testar via API (Desenvolvedores)

### Criar torneio via cURL:
```bash
curl -X POST http://localhost:3000/api/roi/sessions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_jogo": "MTT",
    "buy_in": 50,
    "premio": 150,
    "data": "2026-01-07T10:00:00Z"
  }'
```

### Verificar ROI via cURL:
```bash
curl http://localhost:3000/api/roi \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada:**
```json
{
  "roi": 25.5,
  "total_buyins": 1000.00,
  "total_premios": 1255.00,
  "num_torneios": 15
}
```

---

## ❓ Troubleshooting

### "Em breve" continua aparecendo
**Causa**: Nenhum torneio registrado no banco de dados

**Solução**:
1. Verifique se está autenticado (token válido)
2. Execute o script de seed: `npm run seed-roi seu@email.com`
3. Ou adicione torneios manualmente

### ROI não atualiza
**Causa**: Backend não está rodando ou não está conectado

**Solução**:
```powershell
cd server
npm run dev  # Iniciar backend
```

### Erro "Token não encontrado"
**Causa**: Não está logado

**Solução**:
1. Faça login no sistema
2. Verifique se o token está no localStorage: `localStorage.getItem('token')`

### Cash games aparecem no ROI
**Causa**: Bug no código (não deveria acontecer)

**Solução**: Cash games são automaticamente excluídos. Se aparecerem, reporte o bug.

---

## 📊 Regras do Cálculo

### O que CONTA no ROI:
✅ Torneios MTT com buy-in  
✅ Torneios SNG com buy-in  
✅ Buy-ins > 0

### O que NÃO CONTA:
❌ Cash games  
❌ Sessões sem tipo de jogo  
❌ Sessões sem buy-in  
❌ Buy-ins = 0

### Fórmula:
```
ROI (%) = ((Total Prêmios - Total Buy-ins) / Total Buy-ins) × 100

Exemplo:
- Buy-ins totais: R$ 1.000
- Prêmios totais: R$ 1.300
- ROI = ((1300 - 1000) / 1000) × 100 = 30%
```

---

## 🚀 Resultado Final

Depois de adicionar dados, você verá:

```
🎯 Métricas de Torneios (MTT/SNG)

ROI (Return on Investment)
    25.5%  ← Verde se positivo, vermelho se negativo
    (Lucro ÷ Buy-ins) × 100

Buy-ins Totais
    R$ 1.000,00
    Soma de todas as entradas

Nº de Torneios
    15
    Apenas MTT e SNG
```

---

## 📝 Comandos Úteis

```powershell
# Popular dados de demonstração
cd server
npm run seed-roi seu@email.com

# Iniciar backend
cd server
npm run dev

# Iniciar frontend
cd client
npm run dev

# Ver logs do backend
cd server
tail -f server.log
```

---

**Pronto! Agora o "Em breve" desaparece e o ROI funciona! 🎉**
