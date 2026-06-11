import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEligibleTargets, pickRandomTarget } from '../../engine/matchingEngine';
import type { Player } from '../../types/index.js';
import {
  biFemale,
  biFemaleTargetMaleOnly,
  biMale,
  biMaleTargetBoth,
  closedFemale,
  closedMale,
  closedMaleOrphan,
  heteroFemale,
  heteroFemale2,
  heteroMale,
  heteroMale2,
  homoFemale,
  homoMale,
  homoMale2,
  openFemaleOutside,
  openMaleNoOutside,
  openMaleOutside,
  p1T1,
  p1T2,
  p1T2Coupled,
  p2T1,
  p2T2,
  p2T2Coupled,
  p3T1,
  p3T2,
} from '../fixtures/players';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** A second homo female for tests that need a pair of same-sex attracted players. */
const secondHomoFemale: Player = {
  id: 'hof2',
  name: 'HomoF2',
  sex: 'female',
  orientation: 'homo',
  relationshipStatus: 'single',
};

// ───────────────────────────────────────────────────────────────────────────────
//  getEligibleTargets
// ───────────────────────────────────────────────────────────────────────────────

describe('getEligibleTargets', () => {
  // ── Tier 1 ───────────────────────────────────────────────────────────────

  describe('Tier 1', () => {
    it('returns all other players (2 of 3)', () => {
      const result = getEligibleTargets(p1T1, [p1T1, p2T1, p3T1], 1);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(expect.arrayContaining(['p2', 'p3']));
    });

    it('excludes the active player', () => {
      const result = getEligibleTargets(p1T1, [p1T1, p2T1, p3T1], 1);
      expect(result.find((p) => p.id === 'p1')).toBeUndefined();
    });

    it('returns empty array when only 1 player exists', () => {
      const result = getEligibleTargets(p1T1, [p1T1], 1);
      expect(result).toHaveLength(0);
    });

    it('returns the other player when exactly 2 players', () => {
      const result = getEligibleTargets(p1T1, [p1T1, p2T1], 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p2');
    });
  });

  // ── Tier 2 ───────────────────────────────────────────────────────────────

  describe('Tier 2', () => {
    it('single player (no partnerId) returns all others', () => {
      const result = getEligibleTargets(p1T2, [p1T2, p2T2, p3T2], 2);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(expect.arrayContaining(['p2', 'p3']));
    });

    it('coupled player returns ONLY their partner', () => {
      const result = getEligibleTargets(p1T2Coupled, [p1T2Coupled, p2T2Coupled], 2);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p2');
    });

    it('coupled player whose partner is not in the game returns []', () => {
      const result = getEligibleTargets(p1T2Coupled, [p1T2Coupled], 2);
      expect(result).toHaveLength(0);
    });

    it('single player does not filter by partnerId — returns all others', () => {
      const result = getEligibleTargets(p1T2, [p1T2, p2T2Coupled, p3T2], 2);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.id)).toEqual(expect.arrayContaining(['p2', 'p3']));
    });
  });

  // ── Tiers 3 & 4 ──────────────────────────────────────────────────────────

  describe('Tiers 3 & 4', () => {
    // ── C1: Orientation attraction ────────────────────────────────────────

    describe('C1 — Orientation attraction', () => {
      it('hetero male + hetero female → eligible (tier 3)', () => {
        const result = getEligibleTargets(heteroMale, [heteroMale, heteroFemale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hf');
      });

      it('hetero male + hetero female → eligible (tier 4)', () => {
        const result = getEligibleTargets(heteroMale, [heteroMale, heteroFemale], 4);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hf');
      });

      it('two hetero males → NOT eligible (same sex)', () => {
        const result = getEligibleTargets(heteroMale, [heteroMale, heteroMale2], 3);
        expect(result).toHaveLength(0);
      });

      it('two hetero females → NOT eligible (same sex)', () => {
        const result = getEligibleTargets(heteroFemale, [heteroFemale, heteroFemale2], 3);
        expect(result).toHaveLength(0);
      });

      it('homo male + homo male → eligible', () => {
        const result = getEligibleTargets(homoMale, [homoMale, homoMale2], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hom2');
      });

      it('homo male + homo female → NOT eligible (opposite sex)', () => {
        const result = getEligibleTargets(homoMale, [homoMale, homoFemale], 3);
        expect(result).toHaveLength(0);
      });

      it('homo female + homo female → eligible', () => {
        const result = getEligibleTargets(homoFemale, [homoFemale, secondHomoFemale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hof2');
      });

      it('bi male + hetero female → eligible', () => {
        const result = getEligibleTargets(biMale, [biMale, heteroFemale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hf');
      });

      it('bi female + bi male → eligible', () => {
        const result = getEligibleTargets(biFemale, [biFemale, biMale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('bim');
      });

      it('bi male + homo male → eligible (bi attracted to all; homo attracted to same sex)', () => {
        const result = getEligibleTargets(biMale, [biMale, homoMale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hom');
      });
    });

    // ── C2: Closed relationships ─────────────────────────────────────────

    describe('C2 — Closed relationships', () => {
      it('closed couple (male + female) — each is eligible for the other', () => {
        const fromMale = getEligibleTargets(closedMale, [closedMale, closedFemale], 3);
        expect(fromMale).toHaveLength(1);
        expect(fromMale[0].id).toBe('cf');

        const fromFemale = getEligibleTargets(closedFemale, [closedMale, closedFemale], 3);
        expect(fromFemale).toHaveLength(1);
        expect(fromFemale[0].id).toBe('cm');
      });

      it('closed male vs a third person → NOT eligible', () => {
        const result = getEligibleTargets(closedMale, [closedMale, heteroMale], 3);
        expect(result).toHaveLength(0);
      });

      it('closed female vs a third person → NOT eligible', () => {
        const result = getEligibleTargets(closedFemale, [closedFemale, heteroFemale], 3);
        expect(result).toHaveLength(0);
      });

      it('closed orphan (partner not in game) → empty array', () => {
        const result = getEligibleTargets(closedMaleOrphan, [closedMaleOrphan, heteroMale], 3);
        expect(result).toHaveLength(0);
      });
    });

    // ── C3: Open relationships & targetSex ───────────────────────────────

    describe('C3 — Open relationships & targetSex', () => {
      it('open male (openToOutside) + single hetero female → eligible', () => {
        const result = getEligibleTargets(openMaleOutside, [openMaleOutside, heteroFemale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hf');
      });

      it('open male (NO outside) + single hetero female → NOT eligible', () => {
        const result = getEligibleTargets(openMaleNoOutside, [openMaleNoOutside, heteroFemale], 3);
        expect(result).toHaveLength(0);
      });

      it('open female (openToOutside) + single hetero male → eligible', () => {
        const result = getEligibleTargets(openFemaleOutside, [openFemaleOutside, heteroMale], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('hm');
      });

      it('two open players (both openToOutside, compatible orientation) → eligible', () => {
        const result = getEligibleTargets(openMaleOutside, [openMaleOutside, openFemaleOutside], 3);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('of');
      });

      it('bi female (targetSex:male) + bi male → eligible (target matches)', () => {
        const result = getEligibleTargets(
          biFemaleTargetMaleOnly,
          [biFemaleTargetMaleOnly, biMale],
          3,
        );
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('bim');
      });

      it('bi female (targetSex:male) + bi female → NOT eligible (target sex mismatch)', () => {
        const result = getEligibleTargets(
          biFemaleTargetMaleOnly,
          [biFemaleTargetMaleOnly, biFemale],
          3,
        );
        expect(result).toHaveLength(0);
      });

      it('bi male (targetSex:both) + anyone → eligible regardless of sex', () => {
        const withFemale = getEligibleTargets(biMaleTargetBoth, [biMaleTargetBoth, biFemale], 3);
        expect(withFemale).toHaveLength(1);
        expect(withFemale[0].id).toBe('bif');

        const withMale = getEligibleTargets(biMaleTargetBoth, [biMaleTargetBoth, biMale], 3);
        expect(withMale).toHaveLength(1);
        expect(withMale[0].id).toBe('bim');
      });
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────────
//  pickRandomTarget
// ───────────────────────────────────────────────────────────────────────────────

describe('pickRandomTarget', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined when no eligible targets exist', () => {
    const result = pickRandomTarget(heteroMale, [heteroMale, heteroMale2], 3);
    expect(result).toBeUndefined();
  });

  it('returns a player from the eligible pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = pickRandomTarget(heteroMale, [heteroMale, heteroFemale], 3);
    expect(result).toBeDefined();
    expect(result!.id).toBe('hf');
  });

  it('returns the only eligible player when pool has exactly one', () => {
    const result = pickRandomTarget(p1T1, [p1T1, p2T1], 1);
    expect(result).toBeDefined();
    expect(result!.id).toBe('p2');
  });

  it('uses Math.random for selection', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    pickRandomTarget(p1T1, [p1T1, p2T1, p3T1], 1);
    expect(spy).toHaveBeenCalled();
  });
});
