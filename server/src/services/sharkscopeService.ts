export interface SharkPlayerResult {
  name: string;
  games: number;
  buyins: number;
  roi: number;
  cashes: number;
  other?: any;
}

// Try to fetch from real SharkScope-like API when API key is configured.
// Otherwise return a deterministic mock result so frontend can be developed.
export async function fetchPlayerFromSharkScope(name: string): Promise<SharkPlayerResult> {
  const key = process.env.SHARKSCOPE_API_KEY;
  const normalized = name.trim();
  if (!normalized) throw new Error('Player name required');

  if (!key) {
    // Mock deterministic response (based on name hash)
    const hash = Array.from(normalized).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const games = (hash % 1200) + 20;
    const buyins = Math.max(1, Math.round(games / (10 + (hash % 10))));
    const roi = +((((hash % 300) - 120) / 100).toFixed(2));
    const cashes = Math.max(0, Math.round(games * (0.05 + ((hash % 30) / 1000))));
    return {
      name: normalized,
      games,
      buyins,
      roi,
      cashes,
      other: { note: 'mock result - configure SHARKSCOPE_API_KEY to enable live data' },
    };
  }

  // Attempt to call a SharkScope-like external API. The exact endpoint may change
  // depending on provider. This is a sensible default that uses an Authorization header.
  const url = `https://api.sharkscope.com/v1/player?name=${encodeURIComponent(normalized)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}`, 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`SharkScope API error: ${res.status} ${txt}`);
  }

  const json: any = await res.json();

  // Map expected fields — adapt when using a real provider
  const mapped: SharkPlayerResult = {
    name: json.name || normalized,
    games: Number(json.games || json.total_games || 0),
    buyins: Number(json.buyins || json.total_buyins || 0),
    roi: Number(json.roi || 0),
    cashes: Number(json.cashes || json.in_the_money || 0),
    other: json,
  };

  return mapped;
}
