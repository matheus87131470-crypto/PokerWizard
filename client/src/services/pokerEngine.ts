// Tipos de cartas e utilitários
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  rank: Rank;
  suit: Suit;
  value: number;
}

export interface Hand {
  cards: Card[];
}

export interface PokerSituation {
  position: string;
  hand: Card[];
  communityCards: Card[];
  pot: number;
  stack: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  action: string;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES: Record<Rank, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
};

// Criar deck completo
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        rank,
        suit,
        value: RANK_VALUES[rank]
      });
    }
  }
  return deck;
}

// Embaralhar deck (Fisher-Yates)
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Gerar mão aleatória
export function dealHand(deck: Card[], numCards: number = 2): { hand: Card[], remainingDeck: Card[] } {
  const shuffled = shuffleDeck(deck);
  const hand = shuffled.slice(0, numCards);
  const remainingDeck = shuffled.slice(numCards);
  return { hand, remainingDeck };
}

// Gerar cartas comunitárias
export function dealCommunity(deck: Card[], street: 'flop' | 'turn' | 'river'): { cards: Card[], remainingDeck: Card[] } {
  const numCards = street === 'flop' ? 3 : 1;
  const shuffled = shuffleDeck(deck);
  const cards = shuffled.slice(0, numCards);
  const remainingDeck = shuffled.slice(numCards);
  return { cards, remainingDeck };
}

// Formatar carta para display
export function formatCard(card: Card): string {
  return `${card.rank}${card.suit}`;
}

// Formatar mão para display
export function formatHand(cards: Card[]): string {
  return cards.map(formatCard).join(' ');
}

// Determinar se a mão é suited
export function isSuited(hand: Card[]): boolean {
  if (hand.length !== 2) return false;
  return hand[0].suit === hand[1].suit;
}

// Determinar se a mão é pocket pair
export function isPocketPair(hand: Card[]): boolean {
  if (hand.length !== 2) return false;
  return hand[0].rank === hand[1].rank;
}

// Converter mão para notação padrão (ex: AKs, QQ, 72o)
export function handToNotation(hand: Card[]): string {
  if (hand.length !== 2) return '';
  
  const [card1, card2] = hand;
  const higherRank = card1.value >= card2.value ? card1.rank : card2.rank;
  const lowerRank = card1.value >= card2.value ? card2.rank : card1.rank;
  
  if (isPocketPair(hand)) {
    return `${higherRank}${lowerRank}`;
  }
  
  const suited = isSuited(hand) ? 's' : 'o';
  return `${higherRank}${lowerRank}${suited}`;
}

// Avaliar força da mão (simplificado - 0 a 100)
export function evaluateHandStrength(hand: Card[]): number {
  if (hand.length !== 2) return 0;
  
  const [card1, card2] = hand;
  const highCard = Math.max(card1.value, card2.value);
  const lowCard = Math.min(card1.value, card2.value);
  
  let strength = 0;
  
  // Pocket pairs
  if (isPocketPair(hand)) {
    strength = 50 + (highCard * 3);
  } else {
    // High cards
    strength = (highCard * 2) + lowCard;
    
    // Suited bonus
    if (isSuited(hand)) {
      strength += 5;
    }
    
    // Connector bonus
    if (Math.abs(card1.value - card2.value) === 1) {
      strength += 3;
    }
  }
  
  return Math.min(100, strength);
}

// Gerar situação de treino completa
export function generateTrainingSituation(
  position: string,
  street: 'preflop' | 'flop' | 'turn' | 'river',
  stackSize: number = 100
): PokerSituation {
  const deck = createDeck();
  const { hand, remainingDeck: deck1 } = dealHand(deck);
  
  let communityCards: Card[] = [];
  let remainingDeck = deck1;
  
  if (street !== 'preflop') {
    // Deal flop
    const { cards: flop, remainingDeck: deck2 } = dealCommunity(remainingDeck, 'flop');
    communityCards = flop;
    remainingDeck = deck2;
    
    if (street === 'turn' || street === 'river') {
      // Deal turn
      const { cards: turn, remainingDeck: deck3 } = dealCommunity(remainingDeck, 'turn');
      communityCards = [...communityCards, ...turn];
      remainingDeck = deck3;
      
      if (street === 'river') {
        // Deal river
        const { cards: river } = dealCommunity(remainingDeck, 'river');
        communityCards = [...communityCards, ...river];
      }
    }
  }
  
  return {
    position,
    hand,
    communityCards,
    pot: 0,
    stack: stackSize,
    street,
    action: 'pending'
  };
}

// Verificar se carta está no array
export function hasCard(cards: Card[], card: Card): boolean {
  return cards.some(c => c.rank === card.rank && c.suit === card.suit);
}

// Remover cartas usadas do deck
export function removeCards(deck: Card[], usedCards: Card[]): Card[] {
  return deck.filter(card => !usedCards.some(used => 
    used.rank === card.rank && used.suit === card.suit
  ));
}
