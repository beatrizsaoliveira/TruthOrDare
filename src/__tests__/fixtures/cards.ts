import type { Card } from '../../types/index.js';

// ─── Tier 1 ───────────────────────────────────────────────────────────────────

export const truthT1NoTarget: Card = {
  id: 'fx1',
  type: 'truth',
  tier: 1,
  rawText: 'Qual é o teu hábito mais estranho?',
  shots: null,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const truthT1WithTarget: Card = {
  id: 'fx2',
  type: 'truth',
  tier: 1,
  rawText: 'O que pensas genuinamente de [Target Player]?',
  shots: null,
  hasTarget: true,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const dareT1NoTarget: Card = {
  id: 'fx3',
  type: 'dare',
  tier: 1,
  rawText: 'Faz 10 flexões.',
  shots: null,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const dareT1WithTarget: Card = {
  id: 'fx4',
  type: 'dare',
  tier: 1,
  rawText: 'Dá um abraço a [Target Player].',
  shots: null,
  hasTarget: true,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

// ─── Tier 2 ───────────────────────────────────────────────────────────────────

export const truthT2: Card = {
  id: 'fx5',
  type: 'truth',
  tier: 2,
  rawText: 'Qual é o teu maior segredo?',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const dareT2: Card = {
  id: 'fx6',
  type: 'dare',
  tier: 2,
  rawText: 'Canta uma música.',
  shots: 1,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

// ─── Tier 3 ───────────────────────────────────────────────────────────────────

export const truthT3NoTarget: Card = {
  id: 'fx7',
  type: 'truth',
  tier: 3,
  rawText: 'Descreve a tua fantasia mais ousada.',
  shots: 3,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const dareT3WithTarget: Card = {
  id: 'fx8',
  type: 'dare',
  tier: 3,
  rawText: 'Dá uma massagem nos ombros a [Target Player].',
  shots: 2,
  hasTarget: true,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

// ─── Tier 4 ───────────────────────────────────────────────────────────────────

export const truthT4NoTarget: Card = {
  id: 'fx9',
  type: 'truth',
  tier: 4,
  rawText: 'Extremo verdade.',
  shots: null,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

export const dareT4NoTarget: Card = {
  id: 'fx10',
  type: 'dare',
  tier: 4,
  rawText: 'Extremo desafio.',
  shots: null,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: false,
};

// ─── Card with timer ──────────────────────────────────────────────────────────

export const dareT3WithTimer: Card = {
  id: 'fx50',
  type: 'dare',
  tier: 3,
  rawText: 'Dança durante 30 segundos.',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: 30,
  requiresThirdParty: false,
};

/** Timer above the 60s threshold — must NOT trigger the timer phase. */
export const dareT3WithTimerOver60: Card = {
  id: 'fx51',
  type: 'dare',
  tier: 3,
  rawText: 'Mantém-te em equilíbrio durante 90 segundos.',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: 90,
  requiresThirdParty: false,
};

/** Timer boundary at the minimum (1s) — must trigger the timer phase. */
export const dareT3TimerSeconds1: Card = {
  id: 'fx52',
  type: 'dare',
  tier: 3,
  rawText: 'Fica parado durante 1 segundo.',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: 1,
  requiresThirdParty: false,
};

/** Timer boundary at the maximum (60s) — must trigger the timer phase. */
export const dareT3TimerSeconds60: Card = {
  id: 'fx53',
  type: 'dare',
  tier: 3,
  rawText: 'Dança durante 60 segundos.',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: 60,
  requiresThirdParty: false,
};

/** Timed dare that also lasts multiple rounds — tests effect registration + timer. */
export const dareT3TimedRounds: Card = {
  id: 'fx54',
  type: 'dare',
  tier: 3,
  rawText: 'Fala com sotaque durante 20 segundos nas próximas 2 rondas.',
  shots: 2,
  hasTarget: false,
  roundsCount: 2,
  hasRounds: true,
  timerSeconds: 20,
  requiresThirdParty: false,
};

// ─── Cards requiring a third party (excluded for closed relationships) ────────

export const dareT3RequiresThirdParty: Card = {
  id: 'fx55',
  type: 'dare',
  tier: 3,
  rawText: 'Pede a alguém que não jogue para escolher uma prenda para ti.',
  shots: 2,
  hasTarget: false,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: true,
};

export const dareT4RequiresThirdPartyTarget: Card = {
  id: 'fx56',
  type: 'dare',
  tier: 4,
  rawText: 'Convida [Target Player] e um terceiro convidado para um jogo.',
  shots: 3,
  hasTarget: true,
  roundsCount: null,
  hasRounds: false,
  timerSeconds: null,
  requiresThirdParty: true,
};

// ─── Cards with round duration ──────────────────────────────────────────────

export const dareT1WithRounds: Card = {
  id: 'fx11',
  type: 'dare',
  tier: 1,
  rawText: 'Fala com sotaque estrangeiro durante as próximas 2 rondas.',
  shots: null,
  hasTarget: false,
  roundsCount: 2,
  hasRounds: true,
  timerSeconds: null,
  requiresThirdParty: false,
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
