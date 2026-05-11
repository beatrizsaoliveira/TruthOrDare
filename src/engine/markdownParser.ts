import rawData from '../data/dataset.json';
import type { Card, CardType, Tier } from '../types/index.js';

/**
 * Returns the full list of cards loaded from the static JSON dataset.
 * The JSON is bundled at build time — no runtime parsing needed.
 */
export function loadCards(): Card[] {
  return rawData as Card[];
}

/**
 * Returns only the cards for the given tier and card type.
 * Useful when narrowing the pool before random selection.
 */
export function filterCards(cards: readonly Card[], tier: Tier, type: CardType): Card[] {
  return cards.filter(c => c.tier === tier && c.type === type);
}
