"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAnalyze = canAnalyze;
exports.recordAnalysis = recordAnalysis;
exports.analyzeWithOpenAI = analyzeWithOpenAI;
exports.mockAnalyze = mockAnalyze;
const openai_1 = __importDefault(require("openai"));
// In-memory monthly usage tracking for AI analyses
const aiUsageMap = new Map();
function monthString() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function ensureAiUsageFor(userId) {
    const month = monthString();
    const entry = aiUsageMap.get(userId);
    if (!entry || entry.month !== month) {
        aiUsageMap.set(userId, { month, count: 0 });
        return aiUsageMap.get(userId);
    }
    return entry;
}
function canAnalyze(userId, isPremium) {
    if (isPremium)
        return { ok: true };
    const entry = ensureAiUsageFor(userId);
    const freeLimit = 3; // 3 analyses per month for free users
    if (entry.count >= freeLimit)
        return { ok: false, error: 'limit', remaining: 0 };
    return { ok: true, remaining: Math.max(0, freeLimit - entry.count) };
}
function recordAnalysis(userId, isPremium) {
    if (isPremium)
        return { remaining: -1 };
    const entry = ensureAiUsageFor(userId);
    entry.count = (entry.count || 0) + 1;
    aiUsageMap.set(userId, entry);
    return { remaining: Math.max(0, 3 - entry.count) };
}
// Do not persist history to disk. Process only in memory.
async function analyzeWithOpenAI(history) {
    const key = process.env.OPENAI_API_KEY;
    if (!key)
        throw new Error('OPENAI_API_KEY not configured');
    const client = new openai_1.default({ apiKey: key });
    // System prompt instructing JSON output with required fields
    const system = `Você é um analista profissional de poker. Receba um histórico e responda EXATAMENTE com um JSON válido (sem texto extra) contendo as chaves:
  stats: { vpip: number, pfr: number, aggression_factor: number, other?: object },
  analysis: string,
  improvements: string[],
  leaks: string[],
  summary: string
  `;
    const userPrompt = `Analise o seguinte histórico de mãos e extraia estatísticas (VPIP, PFR, Aggression Factor), identifique erros cometidos, pontos a melhorar, estilo de jogo (tight, loose, agressivo, passivo) e um resumo final. HISTÓRICO:\n${history}`;
    const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.2,
    });
    const content = res?.choices?.[0]?.message?.content || '';
    // Parse JSON from the content
    try {
        const parsed = JSON.parse(content.trim());
        return parsed;
    }
    catch (e) {
        // If parsing fails, throw to let caller fallback or return error
        throw new Error('OpenAI did not return valid JSON');
    }
}
// Lightweight fallback analysis (deterministic-ish) used when OpenAI key missing
function mockAnalyze(history) {
    // Use simple heuristics: count occurrences of actions
    const lc = history.toLowerCase();
    const vpip = Math.min(60, Math.max(5, Math.round((lc.match(/call|limp|raise|bet/g)?.length || 1) * 2)));
    const pfr = Math.min(40, Math.max(1, Math.round((lc.match(/raise|3-bet|4-bet|reraise/g)?.length || 1) * 1.5)));
    const aggression = +(Math.max(0.5, (pfr / Math.max(1, vpip)) * 2).toFixed(2));
    const stats = { vpip, pfr, aggression_factor: aggression };
    const analysis = `Estilo calculado: ${(pfr / Math.max(1, vpip) > 0.6) ? 'Agressivo' : 'Equilibrado'}. VPIP estimado ${vpip}%, PFR estimado ${pfr}%.`;
    const improvements = ['Revisar decisões em 3-bets', 'Reduzir limps em posições iniciais'];
    const leaks = ['Tendency to overcall on later streets', 'Weak postflop c-betting'];
    const summary = 'Análise gerada localmente (fallback). Forneça OPENAI_API_KEY para análise completa.';
    return { stats, analysis, improvements, leaks, summary };
}
//# sourceMappingURL=aiAnalysisService.js.map