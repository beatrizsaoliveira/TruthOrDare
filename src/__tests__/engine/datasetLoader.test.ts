import { describe, expect, it } from 'vitest';
import { filterCards, loadCards } from '../../engine/datasetLoader';
import type { Card, CardType, Tier } from '../../types/index.js';

// ---------------------------------------------------------------------------
// loadCards  (uses the real dataset.json)
// ---------------------------------------------------------------------------

describe('loadCards', () => {
  const cards = loadCards();

  it('returns a non-empty array', () => {
    expect(cards.length).toBeGreaterThan(0);
  });

  it('returns exactly 800 cards', () => {
    expect(cards.length).toBe(800);
  });

  it('returns 200 cards per tier', () => {
    for (const t of [1, 2, 3, 4] as Tier[]) {
      expect(cards.filter((c) => c.tier === t).length).toBe(200);
    }
  });

  it('returns 100 truths and 100 dares per tier', () => {
    for (const t of [1, 2, 3, 4] as Tier[]) {
      expect(cards.filter((c) => c.tier === t && c.type === 'truth').length).toBe(100);
      expect(cards.filter((c) => c.tier === t && c.type === 'dare').length).toBe(100);
    }
  });

  it('all cards have type field that is either "truth" or "dare"', () => {
    for (const c of cards) {
      expect(c.type).toMatch(/^(truth|dare)$/);
    }
  });

  it('all cards have tier field that is 1, 2, 3, or 4', () => {
    for (const c of cards) {
      expect([1, 2, 3, 4] as Tier[]).toContain(c.tier);
    }
  });

  it('all cards have numeric id field', () => {
    for (const c of cards) {
      expect(typeof c.id).toBe('number');
      expect(Number.isInteger(c.id)).toBe(true);
    }
  });

  it('all cards have rawText string field (non-empty)', () => {
    for (const c of cards) {
      expect(typeof c.rawText).toBe('string');
      expect(c.rawText.length).toBeGreaterThan(0);
    }
  });

  it('all cards have hasTarget boolean field', () => {
    for (const c of cards) {
      expect(typeof c.hasTarget).toBe('boolean');
    }
  });

  it('all cards have shots field that is either null or a positive number', () => {
    for (const c of cards) {
      if (c.shots !== null) {
        expect(typeof c.shots).toBe('number');
        expect(c.shots).toBeGreaterThan(0);
      }
    }
  });

  it('all cards have timerSeconds field (number or null)', () => {
    for (const c of cards) {
      expect(c.timerSeconds === null || typeof c.timerSeconds === 'number').toBe(true);
    }
  });

  it('cards from tier 1 have correct tier value', () => {
    const tier1 = cards.filter((c) => c.tier === 1);
    expect(tier1.length).toBeGreaterThan(0);
    for (const c of tier1) {
      expect(c.tier).toBe(1);
    }
  });

  it('cards from tier 2 have correct tier value', () => {
    const tier2 = cards.filter((c) => c.tier === 2);
    expect(tier2.length).toBeGreaterThan(0);
    for (const c of tier2) {
      expect(c.tier).toBe(2);
    }
  });

  it('returns cards for all 4 tiers (each tier has at least some cards)', () => {
    for (const t of [1, 2, 3, 4] as Tier[]) {
      const tierCards = cards.filter((c) => c.tier === t);
      expect(tierCards.length).toBeGreaterThan(0);
    }
  });

  it('returns both truths and dares for at least one tier', () => {
    for (const t of [1, 2, 3, 4] as Tier[]) {
      const truths = cards.filter((c) => c.tier === t && c.type === 'truth');
      const dares = cards.filter((c) => c.tier === t && c.type === 'dare');
      expect(truths.length).toBeGreaterThan(0);
      expect(dares.length).toBeGreaterThan(0);
    }
  });

  it('cards with hasTarget=true have "[Target Player]" in rawText', () => {
    const withTarget = cards.filter((c) => c.hasTarget);
    expect(withTarget.length).toBeGreaterThan(0);
    for (const c of withTarget) {
      expect(c.rawText).toContain('[Target Player]');
    }
  });

  it('truth cards never have timerSeconds', () => {
    const truths = cards.filter((c) => c.type === 'truth');
    expect(truths.length).toBeGreaterThan(0);
    for (const c of truths) {
      expect(c.timerSeconds).toBeNull();
    }
  });

  it('tier 1 dares never have timerSeconds or shots', () => {
    const t1dares = cards.filter((c) => c.tier === 1 && c.type === 'dare');
    for (const c of t1dares) {
      expect(c.shots).toBeNull();
    }
  });

  it('dares with timerSeconds have values between 5 and 600', () => {
    const timed = cards.filter((c) => c.timerSeconds !== null);
    expect(timed.length).toBeGreaterThan(0);
    for (const c of timed) {
      expect(c.type).toBe('dare');
      expect(c.timerSeconds).toBeGreaterThanOrEqual(5);
      expect(c.timerSeconds).toBeLessThanOrEqual(600);
    }
  });

  it('round-based dares never have timerSeconds', () => {
    const roundBased = cards.filter((c) => c.hasRounds);
    for (const c of roundBased) {
      expect(c.timerSeconds).toBeNull();
    }
  });

  it('no duplicate ids within the same tier+type combination', () => {
    for (const t of [1, 2, 3, 4] as Tier[]) {
      for (const tp of ['truth', 'dare'] as CardType[]) {
        const subset = cards.filter((c) => c.tier === t && c.type === tp);
        const ids = subset.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    }
  });

  it('no duplicate card texts across entire dataset', () => {
    const texts = cards.map((c) => c.rawText.trim().toLowerCase());
    const unique = new Set(texts);
    expect(unique.size).toBe(cards.length);
  });

  it('shots range 1-3 for tiers 2-4 (when not null)', () => {
    for (const c of cards) {
      if (c.shots !== null) {
        expect(c.shots).toBeGreaterThanOrEqual(1);
        expect(c.shots).toBeLessThanOrEqual(3);
      }
    }
  });

  it('tier 1 has no shots', () => {
    const t1 = cards.filter((c) => c.tier === 1 && c.shots !== null);
    expect(t1.length).toBe(0);
  });

  it('all cards have a requiresThirdParty boolean field', () => {
    for (const c of cards) {
      expect(typeof c.requiresThirdParty).toBe('boolean');
    }
  });

  it('exactly 15 cards require a third party', () => {
    expect(cards.filter((c) => c.requiresThirdParty).length).toBe(15);
  });

  it('requiresThirdParty cards are only dares in tiers 3-4', () => {
    const thirdParty = cards.filter((c) => c.requiresThirdParty);
    expect(thirdParty.length).toBeGreaterThan(0);
    for (const c of thirdParty) {
      expect(c.type).toBe('dare');
      expect(c.tier).toBeGreaterThanOrEqual(3);
    }
  });

  it('requiresThirdParty and hasTarget can coexist on the same card', () => {
    const both = cards.filter((c) => c.requiresThirdParty && c.hasTarget);
    expect(both.length).toBeGreaterThan(0);
    for (const c of both) {
      expect(c.requiresThirdParty).toBe(true);
      expect(c.hasTarget).toBe(true);
    }
  });

  it('some dares have timerSeconds > 60 (they must NOT trigger the timer phase)', () => {
    const over60 = cards.filter((c) => c.timerSeconds !== null && c.timerSeconds > 60);
    expect(over60.length).toBeGreaterThan(0);
    for (const c of over60) {
      expect(c.type).toBe('dare');
      expect(c.timerSeconds!).toBeGreaterThan(60);
    }
  });

  it('round-based dares never require a third party AND never have timerSeconds', () => {
    const roundBased = cards.filter((c) => c.hasRounds);
    for (const c of roundBased) {
      expect(c.timerSeconds).toBeNull();
      expect(c.requiresThirdParty).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// filterCards  (inline hand-crafted fixtures)
// ---------------------------------------------------------------------------

describe('filterCards', () => {
  const fixture: Card[] = [
    // tier 1 truths
    {
      id: 1,
      type: 'truth',
      tier: 1,
      rawText: 'T1 truth 1',
      shots: null,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    {
      id: 2,
      type: 'truth',
      tier: 1,
      rawText: 'T1 truth 2',
      shots: null,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 1 dares
    {
      id: 3,
      type: 'dare',
      tier: 1,
      rawText: 'T1 dare 1',
      shots: null,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 2 truths
    {
      id: 4,
      type: 'truth',
      tier: 2,
      rawText: 'T2 truth 1',
      shots: 2,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    {
      id: 5,
      type: 'truth',
      tier: 2,
      rawText: 'T2 truth 2',
      shots: 3,
      hasTarget: true,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 2 dares
    {
      id: 6,
      type: 'dare',
      tier: 2,
      rawText: 'T2 dare 1',
      shots: 3,
      hasTarget: true,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 3 truths
    {
      id: 7,
      type: 'truth',
      tier: 3,
      rawText: 'T3 truth 1',
      shots: 2,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 3 dares
    {
      id: 8,
      type: 'dare',
      tier: 3,
      rawText: 'T3 dare 1',
      shots: 3,
      hasTarget: true,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: 30,
      requiresThirdParty: false,
    },
    {
      id: 9,
      type: 'dare',
      tier: 3,
      rawText: 'T3 dare 2',
      shots: 3,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 4 truths
    {
      id: 10,
      type: 'truth',
      tier: 4,
      rawText: 'T4 truth 1',
      shots: 3,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
    // tier 4 dares
    {
      id: 11,
      type: 'dare',
      tier: 4,
      rawText: 'T4 dare 1',
      shots: 3,
      hasTarget: true,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: 60,
      requiresThirdParty: false,
    },
    {
      id: 12,
      type: 'dare',
      tier: 4,
      rawText: 'T4 dare 2',
      shots: null,
      hasTarget: false,
      roundsCount: null,
      hasRounds: false,
      timerSeconds: null,
      requiresThirdParty: false,
    },
  ];

  it('returns only cards with matching tier AND type', () => {
    const result = filterCards(fixture, 2, 'truth');
    expect(result).toHaveLength(2);
    for (const c of result) {
      expect(c.tier).toBe(2);
      expect(c.type).toBe('truth');
    }
  });

  it('returns empty array when no cards match', () => {
    const result = filterCards(fixture, 5 as Tier, 'truth');
    expect(result).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const snapshot = [...fixture];
    filterCards(fixture, 2, 'truth');
    expect(fixture).toEqual(snapshot);
  });

  it('filter preserves timerSeconds', () => {
    const result = filterCards(fixture, 4, 'dare');
    const withTimer = result.filter((c) => c.timerSeconds !== null);
    expect(withTimer.length).toBe(1);
    expect(withTimer[0]!.timerSeconds).toBe(60);
  });
});
