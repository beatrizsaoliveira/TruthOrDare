import type { Player } from '../../types/index.js';

// ─── Tier 1 — minimal (no sex/orientation needed) ────────────────────────────

export const p1T1: Player = { id: 'p1', name: 'Alice' };
export const p2T1: Player = { id: 'p2', name: 'Bob' };
export const p3T1: Player = { id: 'p3', name: 'Carol' };

// ─── Tier 2 — sex required ────────────────────────────────────────────────────

export const p1T2: Player = { id: 'p1', name: 'Alice', sex: 'female' };
export const p2T2: Player = { id: 'p2', name: 'Bob', sex: 'male' };
export const p3T2: Player = { id: 'p3', name: 'Carol', sex: 'female' };

export const p1T2Coupled: Player = { id: 'p1', name: 'Alice', sex: 'female', partnerId: 'p2' };
export const p2T2Coupled: Player = { id: 'p2', name: 'Bob', sex: 'male', partnerId: 'p1' };

// ─── Tier 3/4 — single players ───────────────────────────────────────────────

export const heteroMale: Player = {
    id: 'hm',
    name: 'HeteroM',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'single',
    targetSex: 'female',
};

export const heteroMale2: Player = {
    id: 'hm2',
    name: 'HeteroM2',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'single',
    targetSex: 'female',
};

export const heteroFemale: Player = {
    id: 'hf',
    name: 'HeteroF',
    sex: 'female',
    orientation: 'hetero',
    relationshipStatus: 'single',
    targetSex: 'male',
};

export const heteroFemale2: Player = {
    id: 'hf2',
    name: 'HeteroF2',
    sex: 'female',
    orientation: 'hetero',
    relationshipStatus: 'single',
    targetSex: 'male',
};

export const homoMale: Player = {
    id: 'hom',
    name: 'HomoM',
    sex: 'male',
    orientation: 'homo',
    relationshipStatus: 'single',
};

export const homoMale2: Player = {
    id: 'hom2',
    name: 'HomoM2',
    sex: 'male',
    orientation: 'homo',
    relationshipStatus: 'single',
};

export const homoFemale: Player = {
    id: 'hof',
    name: 'HomoF',
    sex: 'female',
    orientation: 'homo',
    relationshipStatus: 'single',
};

export const biMale: Player = {
    id: 'bim',
    name: 'BiM',
    sex: 'male',
    orientation: 'bi',
    relationshipStatus: 'single',
};

export const biFemale: Player = {
    id: 'bif',
    name: 'BiF',
    sex: 'female',
    orientation: 'bi',
    relationshipStatus: 'single',
};

// ─── Tier 3/4 — closed couples ───────────────────────────────────────────────

export const closedMale: Player = {
    id: 'cm',
    name: 'ClosedM',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'closed',
    partnerId: 'cf',
};

export const closedFemale: Player = {
    id: 'cf',
    name: 'ClosedF',
    sex: 'female',
    orientation: 'hetero',
    relationshipStatus: 'closed',
    partnerId: 'cm',
};

/** Closed player whose partner is NOT in the game */
export const closedMaleOrphan: Player = {
    id: 'cmo',
    name: 'ClosedMOrphan',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'closed',
    partnerId: 'nonexistent',
};

// ─── Tier 3/4 — open relationship players ────────────────────────────────────

export const openMaleOutside: Player = {
    id: 'om',
    name: 'OpenM',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'open',
    openToOutside: true,
    targetSex: 'female',
};

export const openMaleNoOutside: Player = {
    id: 'omno',
    name: 'OpenMNoOutside',
    sex: 'male',
    orientation: 'hetero',
    relationshipStatus: 'open',
    openToOutside: false,
};

export const openFemaleOutside: Player = {
    id: 'of',
    name: 'OpenF',
    sex: 'female',
    orientation: 'hetero',
    relationshipStatus: 'open',
    openToOutside: true,
    targetSex: 'male',
};

// ─── Tier 3/4 — targetSex edge cases ─────────────────────────────────────────

export const biMaleTargetBoth: Player = {
    id: 'tb',
    name: 'BiTargetBoth',
    sex: 'male',
    orientation: 'bi',
    relationshipStatus: 'single',
    targetSex: 'both',
};

export const biFemaleTargetMaleOnly: Player = {
    id: 'tmo',
    name: 'BiTargetMaleOnly',
    sex: 'female',
    orientation: 'bi',
    relationshipStatus: 'single',
    targetSex: 'male',
};
