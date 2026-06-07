import type { Card } from '../../types/index.js';

// ─── Tier 1 ───────────────────────────────────────────────────────────────────

export const truthT1NoTarget: Card = {
    id: 1,
    type: 'truth',
    tier: 1,
    rawText: 'Qual é o teu hábito mais estranho?',
    shots: null,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

export const truthT1WithTarget: Card = {
    id: 2,
    type: 'truth',
    tier: 1,
    rawText: 'O que pensas genuinamente de [Target Player]?',
    shots: null,
    hasTarget: true,
    roundsCount: null,
    hasRounds: false,
};

export const dareT1NoTarget: Card = {
    id: 3,
    type: 'dare',
    tier: 1,
    rawText: 'Faz 10 flexões.',
    shots: null,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

export const dareT1WithTarget: Card = {
    id: 4,
    type: 'dare',
    tier: 1,
    rawText: 'Dá um abraço a [Target Player].',
    shots: null,
    hasTarget: true,
    roundsCount: null,
    hasRounds: false,
};

// ─── Tier 2 ───────────────────────────────────────────────────────────────────

export const truthT2: Card = {
    id: 5,
    type: 'truth',
    tier: 2,
    rawText: 'Qual é o teu maior segredo?',
    shots: 2,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

export const dareT2: Card = {
    id: 6,
    type: 'dare',
    tier: 2,
    rawText: 'Canta uma música.',
    shots: 1,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

// ─── Tier 3 ───────────────────────────────────────────────────────────────────

export const truthT3NoTarget: Card = {
    id: 7,
    type: 'truth',
    tier: 3,
    rawText: 'Descreve a tua fantasia mais ousada.',
    shots: 3,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

export const dareT3WithTarget: Card = {
    id: 8,
    type: 'dare',
    tier: 3,
    rawText: 'Dá uma massagem nos ombros a [Target Player].',
    shots: 2,
    hasTarget: true,
    roundsCount: null,
    hasRounds: false,
};

// ─── Tier 4 ───────────────────────────────────────────────────────────────────

export const truthT4NoTarget: Card = {
    id: 9,
    type: 'truth',
    tier: 4,
    rawText: 'Extremo verdade.',
    shots: null,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

export const dareT4NoTarget: Card = {
    id: 10,
    type: 'dare',
    tier: 4,
    rawText: 'Extremo desafio.',
    shots: null,
    hasTarget: false,
    roundsCount: null,
    hasRounds: false,
};

// ─── Cards with round duration ──────────────────────────────────────────────

export const dareT1WithRounds: Card = {
    id: 11,
    type: 'dare',
    tier: 1,
    rawText: 'Fala com sotaque estrangeiro durante as próximas 2 rondas.',
    shots: null,
    hasTarget: false,
    roundsCount: 2,
    hasRounds: true,
};

// ─── Full mock pool ───────────────────────────────────────────────────────────

export const mockCards: Card[] = [
    truthT1NoTarget,
    truthT1WithTarget,
    dareT1NoTarget,
    dareT1WithTarget,
    truthT2,
    dareT2,
    truthT3NoTarget,
    dareT3WithTarget,
    truthT4NoTarget,
    dareT4NoTarget,
];
