import { afterEach, describe, expect, it, vi } from 'vitest';
import { cardKey, recordCardShown, selectCard } from '../../engine/repetitionEngine';
import type { Card, PlayerHistories } from '../../types/index.js';
import {
  dareT1NoTarget,
  mockCards,
  truthT1NoTarget,
  truthT1WithTarget,
  truthT2,
  truthT3NoTarget,
  truthT4NoTarget,
} from '../fixtures/cards';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const testPlayer1 = { id: 'p1', name: 'Player 1' };
const testPlayer2 = { id: 'p2', name: 'Player 2' };

/** Creates a unique Card with a given id and default truth/tier 1 values. */
function makeCard(id: number, overrides?: Partial<Card>): Card {
  return {
    id,
    type: 'truth',
    tier: 1,
    rawText: '',
    shots: null,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
    ...overrides,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
//  cardKey
// ───────────────────────────────────────────────────────────────────────────────

describe('cardKey', () => {
  it('returns "tier|type|id" format', () => {
    expect(cardKey(truthT1NoTarget)).toBe('1|truth|1');
  });

  it('works for truth and dare types', () => {
    expect(cardKey(dareT1NoTarget)).toBe('1|dare|3');
    expect(cardKey(truthT2)).toBe('2|truth|5');
  });

  it('works for all 4 tiers', () => {
    expect(cardKey(truthT1NoTarget)).toBe('1|truth|1');
    expect(cardKey(truthT2)).toBe('2|truth|5');
    expect(cardKey(truthT3NoTarget)).toBe('3|truth|7');
    expect(cardKey(truthT4NoTarget)).toBe('4|truth|9');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
//  recordCardShown
// ───────────────────────────────────────────────────────────────────────────────

describe('recordCardShown', () => {
  it('creates a new PlayerHistory when player has no history', () => {
    const histories: PlayerHistories = {};
    const updated = recordCardShown(histories, 'p1', truthT1NoTarget);

    expect(updated['p1']).toBeDefined();
    expect(updated['p1'].playerId).toBe('p1');
  });

  it('adds card key to seenCards', () => {
    const histories: PlayerHistories = {};
    const updated = recordCardShown(histories, 'p1', truthT1NoTarget);

    expect(updated['p1'].seenCards.has('1|truth|1')).toBe(true);
  });

  it('adds card key to recentCards', () => {
    const histories: PlayerHistories = {};
    const updated = recordCardShown(histories, 'p1', truthT1NoTarget);

    expect(updated['p1'].recentCards).toContain('1|truth|1');
  });

  it('updates existing history — seenCards grows', () => {
    let histories: PlayerHistories = {};
    histories = recordCardShown(histories, 'p1', truthT1NoTarget);
    expect(histories['p1'].seenCards.size).toBe(1);

    histories = recordCardShown(histories, 'p1', truthT1WithTarget);
    expect(histories['p1'].seenCards.size).toBe(2);
    expect(histories['p1'].seenCards.has('1|truth|1')).toBe(true);
    expect(histories['p1'].seenCards.has('1|truth|2')).toBe(true);
  });

  it('sliding window — recentCards max length is 12', () => {
    let histories: PlayerHistories = {};
    const cards = Array.from({ length: 13 }, (_, i) => makeCard(i));

    for (const card of cards) {
      histories = recordCardShown(histories, 'p1', card);
    }

    expect(histories['p1'].recentCards.length).toBe(12);
  });

  it('first card falls off when 13th card is added', () => {
    let histories: PlayerHistories = {};
    const cards = Array.from({ length: 13 }, (_, i) => makeCard(i));

    for (const card of cards) {
      histories = recordCardShown(histories, 'p1', card);
    }

    // First card (id:0 → key "1|truth|0") should have fallen off
    expect(histories['p1'].recentCards).not.toContain('1|truth|0');
    // 13th card (id:12 → key "1|truth|12") should be present
    expect(histories['p1'].recentCards).toContain('1|truth|12');
  });

  it('does NOT mutate the original histories (immutability)', () => {
    const original: PlayerHistories = {};
    const updated = recordCardShown(original, 'p1', truthT1NoTarget);

    expect(original).not.toBe(updated);
    expect(original['p1']).toBeUndefined();
  });

  it("preserves other players' histories when recording for one player", () => {
    let histories: PlayerHistories = {};
    histories = recordCardShown(histories, 'p2', dareT1NoTarget);

    const updated = recordCardShown(histories, 'p1', truthT1NoTarget);

    expect(updated['p2']).toBeDefined();
    expect(updated['p2'].seenCards.has('1|dare|3')).toBe(true);
    expect(updated['p2'].recentCards).toContain('1|dare|3');
  });
});

// ───────────────────────────────────────────────────────────────────────────────
//  selectCard
// ───────────────────────────────────────────────────────────────────────────────

describe('selectCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a card of the correct tier and type', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const card = selectCard(mockCards, 2, 'dare', testPlayer1, null, {});
    expect(card.tier).toBe(2);
    expect(card.type).toBe('dare');
    expect(card.id).toBe(6); // dareT2
  });

  it('returns a card from the filtered pool (not wrong tier/type)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const card = selectCard(mockCards, 1, 'truth', testPlayer1, null, {});
    expect(card.tier).toBe(1);
    expect(card.type).toBe('truth');
  });

  it('with requireNoTarget=true — returns only cards where hasTarget is false', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const card = selectCard(mockCards, 1, 'truth', testPlayer1, null, {}, true);
    expect(card.hasTarget).toBe(false);
    expect(card.id).toBe(1); // truthT1NoTarget
  });

  it('with requireNoTarget=true and NO no-target cards — falls back to full pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Tier 3 dare pool has only dareT3WithTarget (hasTarget=true)
    const card = selectCard(mockCards, 3, 'dare', testPlayer1, null, {}, true);
    // Fallback opens the pool and returns dareT3WithTarget despite hasTarget
    expect(card).toBeDefined();
    expect(card.hasTarget).toBe(true);
    expect(card.id).toBe(8);
  });

  it('prefers cards NOT recently seen over recently seen ones', () => {
    // Deterministic: mock Math.random → 0 (no jitter, picks first in topN)
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const histories: PlayerHistories = {
      p1: {
        playerId: 'p1',
        seenCards: new Set(['1|truth|1']),
        recentCards: ['1|truth|1'],
      },
    };

    // Pool (tier=1, truth): truthT1NoTarget (key '1|truth|1') in recent → 200
    //                        truthT1WithTarget (key '1|truth|2') unseen → 0
    // Sorted ascending: truthT1WithTarget (0), truthT1NoTarget (200)
    const card = selectCard(mockCards, 1, 'truth', testPlayer1, null, histories);
    expect(card.id).toBe(2); // truthT1WithTarget — the unseen card
  });

  it('prefers cards not seen ever over seen-but-not-recent cards', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const histories: PlayerHistories = {
      p1: {
        playerId: 'p1',
        seenCards: new Set(['1|truth|2']), // truthT1WithTarget seen ever (not recent)
        recentCards: [],
      },
    };

    // truthT1NoTarget (key '1|truth|1') unseen → 0
    // truthT1WithTarget (key '1|truth|2') seen-ever → 30
    const card = selectCard(mockCards, 1, 'truth', testPlayer1, null, histories);
    expect(card.id).toBe(1); // truthT1NoTarget — unseen
  });

  it('penalizes cards recently seen by the partner', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const histories: PlayerHistories = {
      p1: {
        playerId: 'p1',
        seenCards: new Set(),
        recentCards: [],
      },
      p2: {
        playerId: 'p2',
        seenCards: new Set(['1|truth|1']),
        recentCards: ['1|truth|1'],
      },
    };

    // truthT1NoTarget (key '1|truth|1') — partner has it in recent → +80
    // truthT1WithTarget (key '1|truth|2') — no partner history → 0
    const card = selectCard(mockCards, 1, 'truth', testPlayer1, testPlayer2, histories);
    expect(card.id).toBe(2); // truthT1WithTarget — no partner penalty
  });

  it('with empty history — any card in the pool is valid', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const card = selectCard(mockCards, 2, 'truth', testPlayer1, null, {});
    expect(card).toBeDefined();
    expect(card.tier).toBe(2);
    expect(card.type).toBe('truth');
  });

  it('single card in pool — always returns that card regardless of history', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const histories: PlayerHistories = {
      p1: {
        playerId: 'p1',
        seenCards: new Set(['2|truth|5']),
        recentCards: ['2|truth|5'],
      },
    };

    // Tier 2 truth pool has only truthT2
    const card = selectCard(mockCards, 2, 'truth', testPlayer1, null, histories);
    expect(card).toBeDefined();
    expect(card.id).toBe(5); // truthT2
  });

  it('returns a card (not undefined or null)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const card = selectCard(mockCards, 4, 'truth', testPlayer1, null, {});
    expect(card).toBeDefined();
    expect(card).not.toBeNull();
  });
});
