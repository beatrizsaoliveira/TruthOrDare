import rawData from '../data/dataset.json';
import type { Card, CardType, Tier } from '../types/index.js';

type RawEntry = {
  id: number;
  type: CardType;
  tier: Tier;
  rawText: string;
  shots: number | null;
  hasTarget: boolean;
  roundsCount?: number | null;
  hasRounds?: boolean;
  timerSeconds?: number | null;
  requiresThirdParty?: boolean;
};

/**
 * Returns the full list of cards loaded from the static JSON dataset.
 * The JSON is bundled at build time — no runtime parsing needed.
 * `roundsCount`, `hasRounds`, and `timerSeconds` default to null/false
 * for cards that don't have them set in the dataset.
 */
export function loadCards(): Card[] {
  const entries = rawData as unknown as RawEntry[];
  return entries.map((entry) => ({
    ...entry,
    roundsCount: entry.roundsCount ?? null,
    hasRounds: entry.hasRounds ?? false,
    timerSeconds: entry.timerSeconds ?? null,
    requiresThirdParty: entry.requiresThirdParty ?? false,
  }));
}

/**
 * Returns only the cards for the given tier and card type.
 * Useful when narrowing the pool before random selection.
 */
export function filterCards(cards: readonly Card[], tier: Tier, type: CardType): Card[] {
  return cards.filter((c) => c.tier === tier && c.type === type);
}
