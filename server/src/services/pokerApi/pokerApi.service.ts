// Poker API service scaffold — implement provider-specific calls when available

export async function connect(): Promise<{ ok: boolean; message?: string }> {
  // Connect to external poker API provider (placeholder)
  return { ok: true, message: 'connect() not implemented — add credentials and provider SDK' };
}

export async function getHands(options: { userId?: string; since?: string } = {}) {
  // Return an array of hand histories (placeholder)
  return [] as string[];
}

export async function analyzeHand(hand: string) {
  // Analyze a single hand (placeholder)
  return { ok: false, message: 'analyzeHand not implemented' };
}
