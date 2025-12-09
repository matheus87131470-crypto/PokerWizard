import { Request, Response } from 'express';
import { deductCredit, getUserById } from '../services/userService';

interface PlayerSummary {
  id: string;
  nickname: string;
  totalProfit: number;
  roi: number;
  gamesPlayed: number;
  country: string;
  room: string;
  network: string;
}

// Plataformas de poker disponíveis
const POKER_NETWORKS = [
  { id: 'pokerstars', name: 'PokerStars', network: 'PokerStars' },
  { id: 'ggpoker', name: 'GGPoker', network: 'WPT Global' },
  { id: 'partypoker', name: 'partypoker', network: 'iPoker' },
  { id: '888poker', name: '888poker', network: '888poker' },
  { id: 'wptglobal', name: 'WPT Global', network: 'WPT Global' },
  { id: '1win', name: '1Win Poker', network: '1Win' },
  { id: 'jackpoker', name: 'JackPoker', network: 'JackPoker' },
  { id: 'coinpoker', name: 'CoinPoker', network: 'CoinPoker' },
  { id: 'swc', name: 'SWC Poker', network: 'SWC' },
];

// Nomes de exemplo para popular a lista inicial
const defaultNicknames = [
  'PokerMaster99',
  'SilentAssassin',
  'FlopKing',
  'BluffMaster',
  'AllInWin',
  'PerfectPlay',
  'VolumeHunter',
  'ElitePlayer',
  'Matheusac7',
  'BrazilianPro',
  'CariocaKing',
  'SambaPlayer',
];

// Função para gerar dados fictícios de um jogador baseado no nome
function generatePlayerData(nickname: string, id: string, room: string = 'PokerStars'): PlayerSummary {
  // Usa o nickname como seed para gerar dados pseudo-aleatórios consistentes
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    const char = nickname.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const seed = Math.abs(hash) % 1000;
  const roomObj = POKER_NETWORKS.find(n => n.name === room) || POKER_NETWORKS[0];
  const countryChoice = seed % 3 === 0 ? 'Brasil' : seed % 3 === 1 ? 'Argentina' : 'Portugal';

  return {
    id,
    nickname,
    totalProfit: Math.round(((seed * 73) % 50000 + 5000) * 100) / 100,
    roi: Math.round(((seed * 13) % 180 + 50) * 10) / 10,
    gamesPlayed: ((seed * 47) % 1500) + 50,
    country: countryChoice,
    room: roomObj.name,
    network: roomObj.network,
  };
}

function generateMockPlayers(): PlayerSummary[] {
  return defaultNicknames.map((nick, idx) => {
    const room = POKER_NETWORKS[idx % POKER_NETWORKS.length];
    return generatePlayerData(nick, `p-${idx + 1}`, room.name);
  });
}

export function searchPlayers(req: Request, res: Response) {
  const q = (req.query.q as string) || '';
  const room = (req.query.room as string) || '';
  
  if (!q) {
    const players = generateMockPlayers();
    const filtered = room ? players.filter(p => p.room === room) : players;
    return res.json({ ok: true, results: filtered });
  }

  // Se buscar por um nome específico, retorna um resultado com esse nome
  const searchNick = q.toLowerCase();
  const defaultPlayers = generateMockPlayers();
  
  // Procura nos nomes padrão
  const found = defaultPlayers.find(p => p.nickname.toLowerCase().includes(searchNick));
  
  if (found) {
    // Se especificou uma sala, gera dados para aquela sala
    if (room && found.room !== room) {
      const customPlayer = generatePlayerData(found.nickname, `p-custom-${Date.now()}`, room);
      return res.json({ ok: true, results: [customPlayer] });
    }
    return res.json({ ok: true, results: [found] });
  }

  // Se não encontrar nos padrões, gera dados para o nome buscado
  const roomToUse = room || 'PokerStars';
  const customPlayer = generatePlayerData(q, `p-custom-${Date.now()}`, roomToUse);
  return res.json({ ok: true, results: [customPlayer] });
}

export function getNetworks(req: Request, res: Response) {
  res.json({ ok: true, networks: POKER_NETWORKS });
}

export function getPlayerStats(req: Request, res: Response) {
  const { id } = req.params;
  
  // Tenta extrair o nickname do ID ou cria um genérico
  let nickname = `Player ${id}`;
  if (id.startsWith('p-custom-')) {
    nickname = id.split('custom-')[1] || `Player ${id}`;
  } else if (id === 'p-1') {
    nickname = 'PokerMaster99';
  }

  // Usa o mesmo sistema de geração que searchPlayers
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    const char = nickname.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const seed = Math.abs(hash) % 1000;

  const stats = {
    id,
    nickname,
    totalProfit: Math.round(((seed * 73) % 50000 + 1000) * 100) / 100,
    roi: Math.round(((seed * 13) % 180 + 20) * 10) / 10,
    gamesPlayed: ((seed * 47) % 1500) + 20,
    averageBuyin: Math.round(((seed * 11) % 200 + 10) * 100) / 100,
    winRate: Math.round(((seed * 7) % 40 + 30) * 10) / 10,
    vpip: Math.round(((seed * 17) % 40 + 10) * 10) / 10,
    pfr: Math.round(((seed * 19) % 30 + 5) * 10) / 10,
    profitTrend: Array.from({ length: 12 }).map((_, i) => Math.round((((seed + i) * 37) % 2000 - 1000) * 10) / 10),
  };

  res.json({ ok: true, stats });
}

export function getPlayerResults(req: Request, res: Response) {
  const { id } = req.params;
  const limit = Math.min(100, Number(req.query.limit || 20));
  const offset = Number(req.query.offset || 0);
  const filterType = (req.query.type as string) || '';
  const filterRoom = (req.query.room as string) || '';

  // Gera dados pseudo-aleatórios baseados no ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const seed = Math.abs(hash) % 1000;

  const results = Array.from({ length: limit }).map((_, i) => {
    const resultSeed = seed + offset + i;
    const buyin = Math.round((((resultSeed * 23) % 200) + 5) * 100) / 100;
    const prizeMultiplier = ((resultSeed * 31) % 100) / 100;
    const prize = Math.round(buyin * (1 + prizeMultiplier * 5) * 100) / 100;
    const net = Math.round((prize - buyin) * 100) / 100;
    const date = new Date(Date.now() - (offset + i) * 86400000).toISOString();
    const type = (resultSeed % 2) === 0 ? 'MTT' : 'SNG';
    const room = (resultSeed % 2) === 0 ? 'PokerStars' : 'GGPoker';
    
    const item = {
      id: `${id}-r-${offset + i + 1}`,
      date,
      tournament: `Torneio ${Math.floor((resultSeed * 73) % 100000)}`,
      buyin,
      prize,
      net,
      place: Math.floor((resultSeed * 47) % 200) + 1,
      room,
      type,
    };

    if (filterType && item.type !== filterType) return null;
    if (filterRoom && item.room !== filterRoom) return null;

    return item;
  });

  const filtered = results.filter(Boolean);

  res.json({ ok: true, results: filtered, limit, offset });
}

export function getRankings(req: Request, res: Response) {
  const by = (req.query.by as string) || 'profit';
  const room = (req.query.room as string) || '';
  const country = (req.query.country as string) || '';
  const limit = Math.min(100, Number(req.query.limit || 20));

  // Simple mock: generate players and sort by requested metric
  const players = generateMockPlayers();

  const scored = players.map((p) => ({
    ...p,
    score: by === 'roi' ? p.roi : by === 'volume' ? p.gamesPlayed : p.totalProfit,
  }));

  let filtered: Array<any> = scored;
  if (room) filtered = filtered.filter((p) => p.room === room);
  if (country) filtered = filtered.filter((p) => p.country === country);

  filtered = filtered
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, limit)
    .map((p, idx) => ({ rank: idx + 1, nickname: p.nickname, totalProfit: p.totalProfit, roi: p.roi, gamesPlayed: p.gamesPlayed, country: p.country, room: p.room }));

  res.json({ ok: true, results: filtered, by, limit });
}

// -------------------------
// Trainer (AI) mock system
// -------------------------

type TrainerScenario = {
  id: string;
  position: string;
  gameType: string;
  street: string;
  preflopAction: string;
  heroCards: string[];
  board: string[];
  villainRange: string;
  correctAction: string;
  ev: number; // expected value for correct action
  network?: string;
  seats?: { position: string; name: string; stack: number }[];
};

const usageMap: Map<string, { date: string; count: number }> = new Map();
export const subscribers: Set<string> = new Set();
const trainingsMap: Map<string, TrainerScenario[]> = new Map();

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function ensureUsageFor(userId: string) {
  const today = todayString();
  const entry = usageMap.get(userId);
  if (!entry || entry.date !== today) {
    usageMap.set(userId, { date: today, count: 0 });
    return usageMap.get(userId)!;
  }
  return entry;
}

export async function generateScenario(req: any, res: any) {
  const { position = 'BTN', gameType = 'MTT', street = 'Pré-flop', preflopAction = 'Any', network = 'PokerStars', targetNick = '' } = req.body || {};
  const userId = req.userId || (req.body && req.body.user) || (req.query && req.query.user) || null;

  if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

  // Deduct one usage via userService
  const allowed = await deductCredit(userId, 'trainer.generate');
  if (!allowed) {
    const u = await getUserById(userId);
    return res.status(403).json({ ok: false, error: 'no_credits', message: 'Você atingiu o limite de usos gratuitos. Faça upgrade para premium.', remaining: u?.usosRestantes ?? u?.credits ?? 0 });
  }

  // create pseudo-random scenario
  const sid = `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['♠', '♥', '♦', '♣'];
  const randCard = () => `${ranks[Math.floor(Math.random() * ranks.length)]}${suits[Math.floor(Math.random() * suits.length)]}`;
  const hero = [randCard(), randCard()];
  const board: string[] = street !== 'Pré-flop' ? [randCard(), randCard(), randCard()] : [];
  const villainRange = 'JJ+, AKs, AKo';
  const actions = ['Fold', 'Call', 'Raise', 'All-in', 'Check'];
  const correctAction = actions[Math.floor(Math.random() * actions.length)];
  const ev = Math.round((Math.random() * 200 - 50) * 100) / 100; // EV in chips

  const scenario: TrainerScenario = {
    id: sid,
    position,
    gameType,
    street,
    preflopAction,
    heroCards: hero,
    board,
    villainRange,
    correctAction,
    ev,
    network,
  };

  // Generate seats with real-like names and stacks
  const seatOrder = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

  // derive a deterministic seed from provided targetNick/userId/sid
  const seedSource = (targetNick && String(targetNick)) || String(userId) || sid;
  let seedVal = 0;
  for (let i = 0; i < seedSource.length; i++) {
    seedVal = ((seedVal << 5) - seedVal) + seedSource.charCodeAt(i);
    seedVal = seedVal & seedVal;
  }
  const seats = seatOrder.map((p, i) => {
    // Prefer to use default nicknames when possible
    const name = defaultNicknames[i % defaultNicknames.length] || `Player${i + 1}`;
    const stack = Math.round(((Math.abs(seedVal) + i * 37) % 200) * 10 + 100); // synthetic stack size
    return { position: p, name, stack };
  });

  // attach seats to scenario
  scenario.seats = seats;

  // If OPENAI_API_KEY is set, call OpenAI to enrich scenario (explanation, refined villainRange, correctAction, ev)
  const OPENAI = process.env.OPENAI_API_KEY;
  if (OPENAI) {
    try {
      const prompt = `You are an expert poker trainer. Given the following situation, return a JSON object with keys: villainRange (string), correctAction (one of Fold|Call|Raise|All-in|Check), explanation (short text), ev (number). Situation: position=${position}, gameType=${gameType}, street=${street}, preflopAction=${preflopAction}, heroCards=${hero.join(' ')}, board=${board.join(' ')}. Respond ONLY with valid JSON.`;

      // Allow a priority list of models via OPENAI_MODEL_LIST (comma-separated),
      // or a single model via OPENAI_MODEL. Fallback order below.
      const envModels = process.env.OPENAI_MODEL_LIST || process.env.OPENAI_MODEL || '';
      const modelList = envModels
        ? envModels.split(',').map((m) => m.trim()).filter(Boolean)
        : ['gpt-4o-mini', 'gpt-5-mini', 'gpt-3.5-turbo'];

      let usedModel: string | null = null;
      for (const model of modelList) {
        try {
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a concise poker trainer. Return valid JSON only.' },
                { role: 'user', content: prompt },
              ],
              max_tokens: 300,
              temperature: 0.2,
            }),
          });

          const j = await resp.json();
          const content = j?.choices?.[0]?.message?.content || '';
          try {
            const parsed = JSON.parse(content.trim());
            // Accept the model if it returns useful fields
            if (parsed && (parsed.villainRange || parsed.correctAction || typeof parsed.ev === 'number')) {
              if (parsed.villainRange) scenario.villainRange = parsed.villainRange;
              if (parsed.correctAction) scenario.correctAction = parsed.correctAction;
              if (typeof parsed.ev === 'number') scenario.ev = parsed.ev;
              if (parsed.explanation) (scenario as any).aiExplanation = parsed.explanation;
              usedModel = model;
              break;
            }
          } catch (e) {
            // parse error for this model, try next
          }
        } catch (e) {
          // network/error for this model, try next
        }
      }

      if (usedModel) {
        (scenario as any).aiModelUsed = usedModel;
        console.log(`OpenAI scenario enriched using model=${usedModel}`);
      }
    } catch (e) {
      // ignore OpenAI errors and keep mock scenario
      console.error('OpenAI call failed:', (e as any)?.message || e);
    }
  }

  // store scenario per user for history
  const arr = trainingsMap.get(userId) || [];
  arr.push(scenario);
  trainingsMap.set(userId, arr);

  const aiModelUsed = (scenario as any).aiModelUsed || null;
  const aiExplanation = (scenario as any).aiExplanation || null;
  const u = await getUserById(userId);
  const remaining = u ? (u.usosRestantes === -1 || u.usosRestantes === null ? -1 : u.usosRestantes) : null;
  return res.json({ ok: true, scenario, aiModelUsed, aiExplanation, remaining });
}

export function recordResult(req: any, res: any) {
  const { user, scenarioId, chosenAction } = req.body || {};
  const userId = user || 'anon';
  const list = trainingsMap.get(userId) || [];
  const scenario = list.find((s) => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ ok: false, error: 'scenario_not_found' });

  const correct = scenario.correctAction === chosenAction;

  // append result to scenario (simple)
  const result = { scenarioId, chosenAction, correct, timestamp: Date.now(), ev: scenario.ev };
  // keep a small results array on trainingsMap by reusing scenario array (store results separately if needed)
  // for simplicity, store results in a separate map-like structure
  const statKey = `${userId}::results`;
  const existing: any[] = (trainingsMap as any).get(statKey) || [];
  existing.push({ ...result, scenario });
  (trainingsMap as any).set(statKey, existing);

  return res.json({ ok: true, correct, feedback: { correctAction: scenario.correctAction, ev: scenario.ev, villainRange: scenario.villainRange } });
}

export function getUsage(_req: any, res: any) {
  const userId = (_req.query && _req.query.user) || 'anon';
  const usage = ensureUsageFor(userId);
  const freeLimit = 5;
  const remaining = subscribers.has(userId) ? -1 : Math.max(0, freeLimit - usage.count);
  res.json({ ok: true, remaining, used: usage.count });
}

export function getStats(_req: any, res: any) {
  const userId = (_req.query && _req.query.user) || 'anon';
  const statKey = `${userId}::results`;
  const results: any[] = (trainingsMap as any).get(statKey) || [];
  const attempts = results.length;
  const correct = results.filter((r) => r.correct).length;
  const percent = attempts ? Math.round((correct / attempts) * 10000) / 100 : 0;
  // fake other metrics
  const wwsf = attempts ? Math.round((Math.random() * 50 + 30) * 10) / 10 : 0;
  const vpip = attempts ? Math.round((Math.random() * 40 + 10) * 10) / 10 : 0;
  const pfr = attempts ? Math.round((Math.random() * 30 + 5) * 10) / 10 : 0;

  res.json({ ok: true, stats: { attempts, correct, percent, wwsf, vpip, pfr, history: results } });
}

export function subscribe(req: any, res: any) {
  const userId = (req.body && req.body.user) || (req.query && req.query.user) || 'anon';
  subscribers.add(userId);
  // reset usage so they have unlimited
  usageMap.set(userId, { date: todayString(), count: 0 });
  res.json({ ok: true, message: 'subscribed' });
}
