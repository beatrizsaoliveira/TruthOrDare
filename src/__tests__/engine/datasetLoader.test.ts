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
            const truths = cards.filter(
                (c) => c.tier === t && c.type === 'truth'
            );
            const dares = cards.filter(
                (c) => c.tier === t && c.type === 'dare'
            );
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

    it('no duplicate ids within the same tier+type combination', () => {
        for (const t of [1, 2, 3, 4] as Tier[]) {
            for (const tp of ['truth', 'dare'] as CardType[]) {
                const subset = cards.filter(
                    (c) => c.tier === t && c.type === tp
                );
                const ids = subset.map((c) => c.id);
                const uniqueIds = new Set(ids);
                expect(uniqueIds.size).toBe(ids.length);
            }
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
        },
        // tier 3 truths
        {
            id: 7,
            type: 'truth',
            tier: 3,
            rawText: 'T3 truth 1',
            shots: 4,
            hasTarget: false,
            roundsCount: null,
            hasRounds: false,
        },
        // tier 3 dares
        {
            id: 8,
            type: 'dare',
            tier: 3,
            rawText: 'T3 dare 1',
            shots: 5,
            hasTarget: true,
            roundsCount: null,
            hasRounds: false,
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
        },
        // tier 4 truths
        {
            id: 10,
            type: 'truth',
            tier: 4,
            rawText: 'T4 truth 1',
            shots: 5,
            hasTarget: false,
            roundsCount: null,
            hasRounds: false,
        },
        // tier 4 dares
        {
            id: 11,
            type: 'dare',
            tier: 4,
            rawText: 'T4 dare 1',
            shots: 4,
            hasTarget: true,
            roundsCount: null,
            hasRounds: false,
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
        filterCards(fixture, 1, 'dare');
        expect(fixture).toEqual(snapshot);
    });

    it('works correctly for all 4 tier/type combinations', () => {
        // Check tier 1 truths
        expect(filterCards(fixture, 1, 'truth')).toHaveLength(2);
        // tier 1 dares
        expect(filterCards(fixture, 1, 'dare')).toHaveLength(1);
        // tier 2 truths
        expect(filterCards(fixture, 2, 'truth')).toHaveLength(2);
        // tier 2 dares
        expect(filterCards(fixture, 2, 'dare')).toHaveLength(1);
        // tier 3 truths
        expect(filterCards(fixture, 3, 'truth')).toHaveLength(1);
        // tier 3 dares
        expect(filterCards(fixture, 3, 'dare')).toHaveLength(2);
        // tier 4 truths
        expect(filterCards(fixture, 4, 'truth')).toHaveLength(1);
        // tier 4 dares
        expect(filterCards(fixture, 4, 'dare')).toHaveLength(2);
    });

    it('when given an empty array, returns empty array', () => {
        expect(filterCards([], 1, 'truth')).toHaveLength(0);
        expect(filterCards([], 3, 'dare')).toHaveLength(0);
    });

    it('result is a subset of input cards (every returned card was in the input)', () => {
        const result = filterCards(fixture, 3, 'dare');
        for (const c of result) {
            expect(fixture).toContain(c);
        }
    });

    it('filtering "truth" does not include "dare" cards', () => {
        const result = filterCards(fixture, 1, 'truth');
        for (const c of result) {
            expect(c.type).toBe('truth');
        }
    });

    it('filtering tier 1 does not include tier 2+ cards', () => {
        const result = filterCards(fixture, 1, 'truth');
        for (const c of result) {
            expect(c.tier).toBe(1);
        }
    });

    it('works when given cards from multiple tiers/types', () => {
        const mixed: Card[] = [
            {
                id: 100,
                type: 'truth',
                tier: 2,
                rawText: 'mix truth',
                shots: null,
                hasTarget: false,
                roundsCount: null,
                hasRounds: false,
            },
            {
                id: 101,
                type: 'dare',
                tier: 3,
                rawText: 'mix dare',
                shots: 4,
                hasTarget: true,
                roundsCount: null,
                hasRounds: false,
            },
            {
                id: 102,
                type: 'truth',
                tier: 1,
                rawText: 'mix truth t1',
                shots: null,
                hasTarget: false,
                roundsCount: null,
                hasRounds: false,
            },
        ];
        const t2truth = filterCards(mixed, 2, 'truth');
        expect(t2truth).toHaveLength(1);
        expect(t2truth[0].id).toBe(100);

        const t3dare = filterCards(mixed, 3, 'dare');
        expect(t3dare).toHaveLength(1);
        expect(t3dare[0].id).toBe(101);

        expect(filterCards(mixed, 3, 'truth')).toHaveLength(0);
    });
});
