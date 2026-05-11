import type {
  Card,
  CardType,
  Player,
  PlayerHistories,
  PlayerHistory,
  Tier,
} from '../types/index.js';
import { filterCards } from './markdownParser.js';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Number of most-recent card keys to track per player.
 * Cards appearing in this window receive a heavy penalty.
 */
const RECENT_WINDOW = 12;

/**
 * Size of the partner's recent window that incurs a couple-shared penalty.
 * If a card was shown to your partner within the last N cards, it is
 * heavily de-prioritised for you.
 */
const COUPLE_WINDOW = 6;

// ─── Scoring weights ─────────────────────────────────────────────────────────

const SCORE_IN_RECENT = 200; // player just saw this card
const SCORE_SEEN_EVER = 30; // player has seen it before but not recently
const SCORE_COUPLE_RECENT = 80; // partner just saw this card
const SCORE_JITTER_MAX = 15; // random jitter to avoid tie-breaking being deterministic

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Selects the best next card for `activePlayer` given the current histories.
 *
 * Algorithm:
 *  1. Filter the full card pool to the relevant tier + type.
 *  2. Score every candidate based on:
 *     - Whether the player recently saw it (heavy penalty).
 *     - Whether the player has ever seen it (moderate penalty).
 *     - Whether the player's partner recently saw it (medium penalty).
 *     - A random jitter to add variety when scores are equal.
 *  3. Sort ascending by score.
 *  4. Pick uniformly from the top-5 candidates (avoids always returning the same card
 *     when all cards have been seen).
 *
 * When `hasTarget` must be false (no eligible target exists), the pool is
 * pre-filtered accordingly before scoring.
 */
export function selectCard(
  allCards: readonly Card[],
  tier: Tier,
  type: CardType,
  activePlayer: Player,
  partner: Player | null,
  histories: PlayerHistories,
  requireNoTarget?: boolean,
): Card {
  let pool = filterCards(allCards, tier, type);

  if (requireNoTarget) {
    pool = pool.filter(c => !c.hasTarget);
  }

  if (pool.length === 0) {
    // Absolute fallback: if filtering left nothing, open it up
    pool = filterCards(allCards, tier, type);
  }

  const playerHistory = histories[activePlayer.id];
  const partnerHistory = partner ? histories[partner.id] : null;

  const scored = pool.map(card => {
    const key = cardKey(card);
    let score = 0;

    if (playerHistory) {
      if (playerHistory.recentCards.includes(key)) {
        score += SCORE_IN_RECENT;
      } else if (playerHistory.seenCards.has(key)) {
        score += SCORE_SEEN_EVER;
      }
    }

    if (partnerHistory) {
      const coupledWindow = partnerHistory.recentCards.slice(-COUPLE_WINDOW);
      if (coupledWindow.includes(key)) {
        score += SCORE_COUPLE_RECENT;
      }
    }

    score += Math.random() * SCORE_JITTER_MAX;

    return { card, score };
  });

  scored.sort((a, b) => a.score - b.score);

  // Pick from the top 5 to maintain variety
  const topN = scored.slice(0, Math.min(5, scored.length));
  const picked = topN[Math.floor(Math.random() * topN.length)];

  // picked is always defined because pool.length >= 1 at this point
  return ((picked ?? scored[0]) as { card: Card; score: number }).card;
}

/**
 * Returns an updated `PlayerHistories` map after recording that `playerId`
 * was shown `card`. Mutates nothing — returns a new map.
 */
export function recordCardShown(
  histories: PlayerHistories,
  playerId: string,
  card: Card,
): PlayerHistories {
  const key = cardKey(card);
  const prev: PlayerHistory = histories[playerId] ?? {
    playerId,
    seenCards: new Set<string>(),
    recentCards: [],
  };

  const seenCards = new Set(prev.seenCards);
  seenCards.add(key);

  const recentCards = [...prev.recentCards, key].slice(-RECENT_WINDOW);

  return {
    ...histories,
    [playerId]: { playerId, seenCards, recentCards },
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

export function cardKey(card: Card): string {
  return `${card.tier}|${card.type}|${card.id}`;
}
