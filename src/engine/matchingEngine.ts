import type { Player, Tier } from '../types/index.js';

/**
 * Returns the list of players that are eligible interaction targets for
 * `activePlayer` given the current tier.
 *
 * Tiers 1–2: Any other player in the game is eligible.
 *
 * Tiers 3–4 — three-constraint algorithm:
 *   C1 (Orientation): Hetero matches opposite sex; Homo matches same sex; Bi matches either.
 *   C2 (Closed couple): A player in a closed relationship may ONLY be matched with their partner.
 *   C3 (Open/Single): Open-couple and single players may match outside if BOTH parties'
 *        orientation AND declared target-sex preferences align, and open-couple players
 *        have explicitly enabled outside interaction.
 *
 * If no eligible target exists (e.g. all other players are incompatible),
 * the function returns an empty array — callers must handle this gracefully.
 */
export function getEligibleTargets(
    activePlayer: Player,
    allPlayers: readonly Player[],
    tier: Tier
): Player[] {
    if (tier === 1) {
        // Tier 1: no relationship data — any other player is a valid target.
        return allPlayers.filter((p) => p.id !== activePlayer.id);
    }

    if (tier === 2) {
        // Tier 2: if the active player is in a couple, target cards must be
        // directed exclusively at their partner (keeps things comfortable in a
        // friend-group setting where couples are present).
        // Single players (no partnerId) can target anyone else.
        if (activePlayer.partnerId) {
            return allPlayers.filter((p) => p.id === activePlayer.partnerId);
        }
        return allPlayers.filter((p) => p.id !== activePlayer.id);
    }

    return allPlayers.filter((candidate) => {
        if (candidate.id === activePlayer.id) return false;
        return isEligiblePair(activePlayer, candidate);
    });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function isEligiblePair(active: Player, candidate: Player): boolean {
    // C2 – closed relationship: active player can only interact with their partner
    if (active.relationshipStatus === 'closed') {
        return active.partnerId === candidate.id;
    }

    // C2 – closed relationship: candidate can only interact with their partner
    if (candidate.relationshipStatus === 'closed') {
        return candidate.partnerId === active.id;
    }

    // C1 – both parties must be mutually attracted based on orientation
    if (!mutuallyAttracted(active, candidate)) return false;

    // C3 – open-relationship players must have outside-interaction enabled
    if (active.relationshipStatus === 'open' && active.openToOutside !== true)
        return false;
    if (
        candidate.relationshipStatus === 'open' &&
        candidate.openToOutside !== true
    )
        return false;

    // C3 – target-sex preference check (both directions)
    if (!targetSexAllows(active, candidate)) return false;
    if (!targetSexAllows(candidate, active)) return false;

    return true;
}

/**
 * Returns true if `from` is sexually attracted to `to` based on `from`'s orientation.
 * When orientation is undefined (e.g. tier < 3 players), defaults to true.
 */
function isAttractedTo(from: Player, to: Player): boolean {
    if (!from.orientation || !from.sex || !to.sex) return true;
    switch (from.orientation) {
        case 'hetero':
            return from.sex !== to.sex;
        case 'homo':
            return from.sex === to.sex;
        case 'bi':
            return true;
    }
}

function mutuallyAttracted(a: Player, b: Player): boolean {
    return isAttractedTo(a, b) && isAttractedTo(b, a);
}

/**
 * Returns true when `player`'s declared target-sex preference includes
 * the sex of `candidate`. If no preference is set, any sex is accepted.
 */
function targetSexAllows(player: Player, candidate: Player): boolean {
    if (!player.targetSex || !candidate.sex) return true;
    if (player.targetSex === 'both') return true;
    return player.targetSex === candidate.sex;
}

/**
 * Picks a random eligible target from the pool.
 * Returns undefined when the pool is empty.
 */
export function pickRandomTarget(
    activePlayer: Player,
    allPlayers: readonly Player[],
    tier: Tier
): Player | undefined {
    const eligible = getEligibleTargets(activePlayer, allPlayers, tier);
    if (eligible.length === 0) return undefined;
    return eligible[Math.floor(Math.random() * eligible.length)];
}
