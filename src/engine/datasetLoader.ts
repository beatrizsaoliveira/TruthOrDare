import rawData from '../data/dataset.json';
import type { Card, CardType, Tier } from '../types/index.js';

type RawDataset = {
  tiers: Record<string, { truth: Card[]; dare: Card[] }>;
};

const data = rawData as unknown as RawDataset;

/**
 * Returns ALL cards as a flat array. Called once at startup — the nested JSON
 * structure is the storage/readability format; the flat array is the runtime format.
 * Cost: ~0.1 ms for 800 cards — negligible.
 */
export function loadCards(): Card[] {
  const all: Card[] = [];
  for (const tierData of Object.values(data.tiers)) {
    for (const card of tierData.truth) all.push(card);
    for (const card of tierData.dare) all.push(card);
  }
  return all;
}

/**
 * Filters a flat card array by tier and type. Used by the selection engine;
 * also works with hand-crafted test fixtures passed as `cards`.
 */
export function filterCards(cards: readonly Card[], tier: Tier, type: CardType): Card[] {
  return cards.filter((c) => c.tier === tier && c.type === type);
}
