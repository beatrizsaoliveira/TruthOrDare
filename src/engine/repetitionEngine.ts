import type {
  Card,
  CardType,
  Player,
  PlayerHistories,
  PlayerHistory,
  Tier,
} from '../types/index.js';
import { filterCards } from './datasetLoader.js';

// ─── Configuration ────────────────────────────────────────────────────────────

/** How many of the player's own recent cards to penalize heavily. */
const RECENT_WINDOW = 12;

/** Partner's recent window — penalize cards recently shown to the partner. */
const COUPLE_WINDOW = 8;

// ─── Scoring weights ─────────────────────────────────────────────────────────

const SCORE_SELF_RECENT = 200; // player just saw this card
const SCORE_SEEN_EVER = 40; // player has seen it before
const SCORE_COUPLE_RECENT = 120; // partner just saw this card
const SCORE_ANY_RECENT = 80; // any other player recently saw this card
const SCORE_JITTER_MAX = 20; // small jitter for tie-breaking

// ─── Debug ──────────────────────────────────────────────────────────────────

let _debugForceTimer = false;

export function setDebugForceTimer(on: boolean): void {
  _debugForceTimer = on;
}

// ─── selectCard ─────────────────────────────────────────────────────────────

/**
 * Selects the best next card for `activePlayer`.
 *
 * Algorithm:
 *  1. Filter pool by tier + type.
 *  2. Exclude requiresThirdParty cards for closed relationships AND when totalPlayers < 3.
 *  3. Score every candidate:
 *     - +200 if in player's own recent window (last 12)
 *     - +40  if seen ever (but not recent)
 *     - +120 if in partner's recent window (last 8)
 *     - +80  if in ANY other player's recent window
 *     - +0-20 random jitter
 *  4. Pick uniformly from ALL cards tied for the lowest score.
 */
export function selectCard(
  allCards: readonly Card[],
  tier: Tier,
  type: CardType,
  activePlayer: Player,
  partner: Player | null,
  histories: PlayerHistories,
  totalPlayers: number,
  requireNoTarget?: boolean,
): Card {
  let pool = filterCards(allCards, tier, type);

  // DEBUG: force timer dare
  if (_debugForceTimer && type === 'dare') {
    const tp = pool.filter(
      (c) => c.timerSeconds != null && c.timerSeconds > 0 && c.timerSeconds <= 60,
    );
    if (tp.length > 0) {
      pool = tp;
      _debugForceTimer = false;
    }
  }

  // Closed relationship: exclude third-party cards
  if (activePlayer.relationshipStatus === 'closed') {
    pool = pool.filter((c) => !c.requiresThirdParty);
  }

  // Fewer than 3 players: no third-party cards make sense (active + target = 2 max)
  if (totalPlayers < 3) {
    pool = pool.filter((c) => !c.requiresThirdParty);
  }

  if (requireNoTarget) {
    pool = pool.filter((c) => !c.hasTarget);
  }

  if (pool.length === 0) {
    pool = filterCards(allCards, tier, type);
  }

  const playerHistory = histories[activePlayer.id];
  const partnerHistory = partner ? histories[partner.id] : null;

  // Collect keys recently shown to ALL players (for cross-player penalty)
  const allRecentKeys = new Set<string>();
  for (const h of Object.values(histories)) {
    for (const k of h.recentCards.slice(-RECENT_WINDOW)) {
      allRecentKeys.add(k);
    }
  }
  // Remove the active player's own recent keys (they get a separate penalty)
  if (playerHistory) {
    for (const k of playerHistory.recentCards) allRecentKeys.delete(k);
  }
  // Remove partner's recent keys (they get couple penalty)
  if (partnerHistory) {
    for (const k of partnerHistory.recentCards.slice(-COUPLE_WINDOW)) allRecentKeys.delete(k);
  }

  // ── Score ──────────────────────────────────────────────────
  let bestScore = Infinity;
  const scored: { card: Card; score: number }[] = [];

  for (const card of pool) {
    const key = cardKey(card);
    let score = Math.random() * SCORE_JITTER_MAX;

    if (playerHistory) {
      if (playerHistory.recentCards.includes(key)) {
        score += SCORE_SELF_RECENT;
      } else if (playerHistory.seenCards.has(key)) {
        score += SCORE_SEEN_EVER;
      }
    }

    if (partnerHistory) {
      const coupleWindow = partnerHistory.recentCards.slice(-COUPLE_WINDOW);
      if (coupleWindow.includes(key)) {
        score += SCORE_COUPLE_RECENT;
      }
    }

    if (allRecentKeys.has(key)) {
      score += SCORE_ANY_RECENT;
    }

    if (score < bestScore) bestScore = score;
    scored.push({ card, score });
  }

  // ── Pick from ALL cards with the lowest score ────────────────
  const best = scored.filter((s) => s.score <= bestScore + 0.001);
  const picked = best[Math.floor(Math.random() * best.length)];

  return (picked ?? scored[0])!.card;
}

// ─── recordCardShown ─────────────────────────────────────────────────────────

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

// ─── cardKey ─────────────────────────────────────────────────────────────────

export function cardKey(card: Card): string {
  return `${card.tier}|${card.type}|${card.id}`;
}
