import { formatCardText } from '../../engine/cardFormatter.js';
import { setDebugForceTimer } from '../../engine/repetitionEngine.js';
import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import type { Card, Player, RoundEffect } from '../../types/index.js';
import { showConfirm } from '../confirmModal.js';

/** Colour palette for player dot indicators (reserved for future use) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _AVATAR_COLORS = [
  '#7C3AED',
  '#DB2777',
  '#059669',
  '#D97706',
  '#2563EB',
  '#DC2626',
  '#0891B2',
  '#65A30D',
];

// ─── Public ───────────────────────────────────────────────────────────────────

export function createGameScreen(store: GameStore): HTMLElement {
  const state = store.state;

  if (state.phase === 'game-selecting') {
    return buildSelectingScreen(store);
  }

  if (state.phase === 'game-showing') {
    return buildShowingScreen(store);
  }

  if (state.phase === 'game-timer') {
    return buildTimerScreen(store);
  }

  // Fallback
  return el('div', 'screen');
}

// ─── "Selecting" phase ────────────────────────────────────────────────────────

function buildSelectingScreen(store: GameStore): HTMLElement {
  const { players, currentPlayerIndex, penaltiesEnabled, shotCounts, currentRound } = store.state;
  const currentPlayer = players[currentPlayerIndex] as Player;

  const screen = el('div', 'screen');

  // ── Turn banner ───────────────────────────────────────────
  const banner = el('div', 'turn-banner');
  const bannerLabel = el('div', 'turn-banner__label');
  bannerLabel.textContent = 'É a vez de';
  const bannerName = el('h1', 'turn-banner__name');
  bannerName.textContent = currentPlayer.name;

  const tierBadge = el('span', `turn-banner__tier game-card__tier-badge--t${store.state.tier}`);
  tierBadge.textContent = `Tier ${store.state.tier}`;
  tierBadge.setAttribute('aria-label', `Tier ${store.state.tier}`);

  banner.append(bannerLabel, bannerName, tierBadge);

  // Shot debt chip — only visible when penalties are on and shots > 0
  if (penaltiesEnabled) {
    const debt = shotCounts[currentPlayer.id] ?? 0;
    if (debt > 0) {
      const debtEl = el('div', 'turn-banner__shot-debt');
      debtEl.innerHTML = `🍺 Saldo: <strong>${debt}</strong> shot${debt === 1 ? '' : 's'}`;
      banner.appendChild(debtEl);
    }
  }

  // Round badge
  {
    const roundEl = el('div', 'turn-banner__round-badge');
    roundEl.textContent = `🔁 Ronda ${currentRound}`;
    banner.appendChild(roundEl);
  }

  // ── Player dots ───────────────────────────────────────────
  const dotsRow = el('div', 'container');
  dotsRow.style.cssText = 'padding-top:1rem;padding-bottom:.5rem;';
  const dots = el('div', 'player-dots');
  dots.setAttribute('aria-label', 'Turno dos jogadores');
  players.forEach((p, i) => {
    const dot = el('div', `player-dot${i === currentPlayerIndex ? ' player-dot--active' : ''}`);
    dot.setAttribute('title', p.name);
    dot.setAttribute('aria-label', i === currentPlayerIndex ? `${p.name} (turno atual)` : p.name);
    dots.appendChild(dot);
  });
  dotsRow.appendChild(dots);

  // ── Main content ──────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:2rem 0;overflow-y:auto;overflow-x:hidden;';

  const container = el('div', 'container stack stack--6 text-center');

  const prompt = el('p', 'heading-md text-muted');
  prompt.textContent = `${currentPlayer.name}, escolhe:`;

  const choiceBtns = el('div', 'row row--center');
  choiceBtns.style.gap = '1rem';

  const truthBtn = el<HTMLButtonElement>('button', 'btn btn--truth');
  truthBtn.innerHTML = '<span aria-hidden="true">🤔</span>VERDADE';
  truthBtn.setAttribute('aria-label', 'Verdade — escolher uma pergunta');
  truthBtn.addEventListener('click', () => store.update(Actions.chooseCardType('truth')));

  const dareBtn = el<HTMLButtonElement>('button', 'btn btn--dare');
  dareBtn.innerHTML = '<span aria-hidden="true">🔥</span>DESAFIO';
  dareBtn.setAttribute('aria-label', 'Desafio — receber um desafio');
  dareBtn.addEventListener('click', () => store.update(Actions.chooseCardType('dare')));

  choiceBtns.append(truthBtn, dareBtn);
  container.append(prompt, choiceBtns);
  main.appendChild(container);

  // ── Footer ────────────────────────────────────────────────
  const footer = el('footer', 'container pb-safe');
  footer.style.cssText =
    'padding-top:.75rem;padding-bottom:var(--dock-clearance);display:flex;flex-direction:column;gap:.5rem;';

  const skipBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--sm');
  skipBtn.style.cssText = 'width:100%;color:var(--clr-text-muted);';
  skipBtn.textContent = '⏭️  Saltar Jogador';
  skipBtn.setAttribute('aria-label', 'Saltar este jogador e passar ao próximo');
  skipBtn.addEventListener('click', () => {
    showConfirm({
      title: 'Saltar Jogador',
      message: `Saltar ${currentPlayer.name} e passar ao próximo jogador?`,
      confirmLabel: 'Saltar',
    }).then((ok) => {
      if (ok) store.update(Actions.skipPlayer());
    });
  });
  footer.appendChild(skipBtn);

  const endBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--sm');
  endBtn.style.cssText = 'width:100%;color:var(--clr-text-muted);';
  endBtn.textContent = 'Terminar Jogo';
  endBtn.setAttribute('aria-label', 'Terminar o jogo e voltar ao início');
  endBtn.addEventListener('click', () => {
    showConfirm({
      title: 'Terminar Jogo',
      message: 'Tens a certeza que queres terminar o jogo?',
      confirmLabel: 'Terminar',
      danger: true,
    }).then((ok) => {
      if (ok) store.update(Actions.endGame());
    });
  });
  footer.appendChild(endBtn);

  // ── Round expiry overlay ──────────────────────────────────
  const { pendingRoundExpiry } = store.state;
  if (pendingRoundExpiry.length > 0) {
    const overlay = buildRoundExpiryOverlay(pendingRoundExpiry, store);
    screen.style.position = 'relative';
    screen.appendChild(overlay);
  }

  // DEBUG: Ctrl+Shift+K (Cmd+Shift+K on Mac) forces next dare to have a countdown timer
  document.addEventListener('keydown', function _debugTimerShortcut(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      e.preventDefault();
      if (store.state.phase !== 'game-selecting') return;
      setDebugForceTimer(true);
      dareBtn.style.outline = '3px solid #fbbf24';
      dareBtn.style.outlineOffset = '3px';
      dareBtn.innerHTML = '<span aria-hidden="true">🔥</span>DESAFIO ⏱️';
      setTimeout(() => {
        dareBtn.style.outline = '';
        dareBtn.style.outlineOffset = '';
        dareBtn.innerHTML = '<span aria-hidden="true">🔥</span>DESAFIO';
      }, 2000);
    }
  });

  screen.append(banner, dotsRow, main, footer);
  return screen;
}

// ─── "Showing" phase ──────────────────────────────────────────────────────────

function buildShowingScreen(store: GameStore): HTMLElement {
  const {
    players,
    currentPlayerIndex,
    currentCard,
    currentTargetPlayerId,
    penaltiesEnabled,
    showingPenalty,
  } = store.state;

  const currentPlayer = players[currentPlayerIndex] as Player;
  const targetPlayer =
    currentTargetPlayerId ? players.find((p) => p.id === currentTargetPlayerId) : undefined;

  const screen = el('div', 'screen');

  if (showingPenalty && currentCard) {
    return buildPenaltyOverlayInScreen(screen, currentCard, store);
  }

  // ── Turn banner (compact) ─────────────────────────────────
  const banner = buildCompactBanner(
    currentPlayer,
    currentPlayerIndex,
    players.length,
    store.state.currentRound,
  );
  screen.appendChild(banner);

  // ── Card ──────────────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:1.5rem 0;overflow-y:auto;overflow-x:hidden;';

  const container = el('div', 'container stack stack--5');

  if (currentCard) {
    const cardEl = buildGameCard(currentCard, currentPlayer, targetPlayer, penaltiesEnabled);
    container.appendChild(cardEl);
  }

  main.appendChild(container);

  // ── Action buttons ────────────────────────────────────────
  const footer = el('footer', 'container stack stack--3 pb-safe');
  footer.style.cssText = 'padding-top:1rem;padding-bottom:var(--dock-clearance);';

  const acceptBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--full btn--lg');
  const hasTimer =
    currentCard?.timerSeconds != null &&
    currentCard.timerSeconds > 0 &&
    currentCard.timerSeconds <= 60;
  acceptBtn.innerHTML = hasTimer ? '⏱️  Aceitar Desafio' : '✅  Feito!';
  acceptBtn.setAttribute(
    'aria-label',
    hasTimer ?
      'Aceitar desafio com cronómetro'
    : 'Marquei como feito, passar para o próximo jogador',
  );
  acceptBtn.addEventListener('click', () => store.update(Actions.acceptCard()));

  footer.appendChild(acceptBtn);

  if (currentCard) {
    const refuseBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
    const shotsHint = penaltiesEnabled && currentCard.shots ? ` (${currentCard.shots} shots)` : '';
    refuseBtn.innerHTML = `❌  Recusar${shotsHint}`;
    refuseBtn.setAttribute('aria-label', `Recusar o desafio${shotsHint}`);
    refuseBtn.addEventListener('click', () => store.update(Actions.refuseCard()));
    footer.appendChild(refuseBtn);
  }

  screen.append(main, footer);
  return screen;
}

// ─── Timer screen ─────────────────────────────────────────────────────────────

function buildTimerScreen(store: GameStore): HTMLElement {
  const { currentCard, players, currentPlayerIndex, penaltiesEnabled, timerRunning } = store.state;
  const currentPlayer = players[currentPlayerIndex] as Player;
  const targetPlayerId = store.state.currentTargetPlayerId;
  const targetPlayer = targetPlayerId ? players.find((p) => p.id === targetPlayerId) : undefined;

  const timerSeconds = currentCard?.timerSeconds ?? 0;
  let remaining = timerSeconds;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const screen = el('div', 'screen timer-screen');

  // ── Banner ────────────────────────────────────────────────
  const banner = buildCompactBanner(
    currentPlayer,
    currentPlayerIndex,
    players.length,
    store.state.currentRound,
  );
  screen.appendChild(banner);

  // ── Main ──────────────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center;';

  const container = el('div', 'timer-screen__content stack stack--5');

  // Challenge text
  if (currentCard) {
    const cardLabel = el('p', 'timer-screen__label text-muted');
    cardLabel.textContent = 'Desafio aceite:';
    container.appendChild(cardLabel);

    const cardText = el('p', 'timer-screen__challenge');
    cardText.innerHTML = formatCardText(currentCard.rawText, currentPlayer, targetPlayer);
    container.appendChild(cardText);
  }

  // Timer display
  const timeDisplay = el('div', 'timer-screen__time');
  timeDisplay.setAttribute('aria-live', 'polite');
  timeDisplay.setAttribute('aria-label', `${remaining} segundos restantes`);
  timeDisplay.textContent = formatTime(remaining);

  const timeLabel = el('p', 'timer-screen__time-label');
  timeLabel.textContent = timerRunning ? '⏳ A cumprir o desafio...' : '⏱️ Pronto para começar?';

  container.append(timeDisplay, timeLabel);

  // ── Buttons ───────────────────────────────────────────────
  const actions = el('div', 'timer-screen__actions stack stack--3');

  if (!timerRunning) {
    // Start button
    const startBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--lg btn--full');
    startBtn.innerHTML = '▶️  Iniciar';
    startBtn.setAttribute('aria-label', `Iniciar contagem de ${remaining} segundos`);
    startBtn.addEventListener('click', () => {
      store.update(Actions.startTimer());
      // Re-render with timerRunning = true
    });
    actions.appendChild(startBtn);

    // Refuse button
    const refuseBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
    const shotsHint = penaltiesEnabled && currentCard?.shots ? ` (${currentCard.shots} shots)` : '';
    refuseBtn.innerHTML = `❌  Recusar${shotsHint}`;
    refuseBtn.setAttribute('aria-label', `Recusar cumprir o desafio${shotsHint}`);
    refuseBtn.addEventListener('click', () => store.update(Actions.refuseTimer()));
    actions.appendChild(refuseBtn);

    setTimeout(() => startBtn.focus(), 50);
  }

  container.appendChild(actions);
  main.appendChild(container);
  screen.appendChild(main);

  // ── Timer interval (only when running) ─────────────────────
  if (timerRunning) {
    // No buttons — just show countdown
    timeDisplay.classList.add('timer-screen__time--running');

    intervalId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        if (intervalId) clearInterval(intervalId);
        store.update(Actions.completeTimer());
        return;
      }
      timeDisplay.textContent = formatTime(remaining);
      timeDisplay.setAttribute('aria-label', `${remaining} segundos restantes`);
    }, 1000);

    // Easing pulse animation
    timeDisplay.style.animation = 'timer-pulse 1s ease-in-out infinite';
  }

  return screen;
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
  }
  return `${seconds}s`;
}

// ─── Game card ────────────────────────────────────────────────────────────────

function buildGameCard(
  card: Card,
  activePlayer: Player,
  targetPlayer?: Player,
  penaltiesEnabled = false,
): HTMLElement {
  const cardEl = el('div', `game-card game-card--${card.type}`);
  cardEl.setAttribute('role', 'article');
  cardEl.setAttribute(
    'aria-label',
    card.type === 'truth' ? 'Carta de verdade' : 'Carta de desafio',
  );

  const badge = el('div', `game-card__type-badge game-card__type-badge--${card.type}`);
  badge.innerHTML =
    card.type === 'truth' ?
      '<span aria-hidden="true">🤔</span> Verdade'
    : '<span aria-hidden="true">🔥</span> Desafio';

  const textEl = el('p', 'game-card__text');
  const formatted = formatCardText(card.rawText, activePlayer, targetPlayer);
  textEl.innerHTML = formatted;

  cardEl.append(badge, textEl);

  if (penaltiesEnabled && card.shots !== null) {
    const shotsEl = el('div', 'game-card__shots');
    shotsEl.setAttribute('aria-label', `Penalização: ${card.shots} shots`);
    shotsEl.textContent = `🍺 ${card.shots} shot${card.shots > 1 ? 's' : ''} se recusar`;
    cardEl.appendChild(shotsEl);
  }

  return cardEl;
}

// ─── Penalty overlay ──────────────────────────────────────────────────────────

function buildPenaltyOverlayInScreen(
  screen: HTMLElement,
  card: Card,
  store: GameStore,
): HTMLElement {
  const maxShots = card.shots ?? 0;

  const overlay = el('div', 'penalty-overlay');
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'penalty-title');

  const box = el('div', 'penalty-box');

  const icon = el('span', 'penalty-box__icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🍺';

  const title = el('h2', 'heading-lg');
  title.id = 'penalty-title';
  title.textContent = 'Recusaste!';

  box.append(icon, title);

  if (maxShots > 0) {
    // ── How-many prompt ───────────────────────────────────
    const desc = el('p', 'body-md text-muted');
    desc.style.cssText = 'margin-top:var(--sp-3);margin-bottom:0;';
    desc.textContent = 'Quantos shots bebeste?';
    box.appendChild(desc);

    // ── Stepper ───────────────────────────────────────────
    let qty = maxShots;
    const stepperRow = el('div', 'penalty-box__stepper');

    const minusBtn = el<HTMLButtonElement>('button', 'penalty-box__step-btn');
    minusBtn.type = 'button';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('aria-label', 'Diminuir');

    const qtyDisplay = el('div', 'penalty-box__qty');

    const plusBtn = el<HTMLButtonElement>('button', 'penalty-box__step-btn');
    plusBtn.type = 'button';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('aria-label', 'Aumentar');

    function updateQty(n: number): void {
      qty = Math.max(0, n);
      qtyDisplay.textContent = String(qty);
      minusBtn.disabled = qty === 0;
    }
    updateQty(maxShots);

    minusBtn.addEventListener('click', () => updateQty(qty - 1));
    plusBtn.addEventListener('click', () => updateQty(qty + 1));

    stepperRow.append(minusBtn, qtyDisplay, plusBtn);
    box.appendChild(stepperRow);

    // ── Action buttons ────────────────────────────────────
    const actions = el('div', 'penalty-box__actions');

    const confirmBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--lg btn--full');
    confirmBtn.textContent = '✅  Confirmar';
    confirmBtn.addEventListener('click', () => store.update(Actions.confirmPenalty(qty)));

    const skipBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
    skipBtn.textContent = '❌  Não bebi nada';
    skipBtn.addEventListener('click', () => store.update(Actions.confirmPenalty(0)));

    actions.append(confirmBtn, skipBtn);
    box.appendChild(actions);

    setTimeout(() => confirmBtn.focus(), 50);
  } else {
    // No shots on this card — just advance
    const doneBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--lg btn--full');
    doneBtn.style.marginTop = 'var(--sp-4)';
    doneBtn.textContent = '✅  Feito!';
    doneBtn.addEventListener('click', () => store.update(Actions.confirmPenalty(0)));
    box.appendChild(doneBtn);
    setTimeout(() => doneBtn.focus(), 50);
  }

  overlay.appendChild(box);

  // Append overlay on top of existing screen content
  screen.style.position = 'relative';
  screen.appendChild(overlay);

  return screen;
}

// ─── Compact banner ───────────────────────────────────────────────────────────

function buildCompactBanner(
  player: Player,
  idx: number,
  total: number,
  currentRound: number,
): HTMLElement {
  const wrap = el('div', 'turn-banner');
  wrap.style.cssText =
    'padding:.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;' +
    'border-radius:0 0 var(--r-xl) var(--r-xl);';

  const nameWrap = el('div', '');
  const label = el('div', 'turn-banner__label');
  label.textContent = 'É a vez de';
  const name = el('div', 'heading-sm');
  name.style.color = '#fff';
  name.textContent = player.name;
  nameWrap.append(label, name);

  const counterWrap = el('div', '');
  counterWrap.style.cssText = 'text-align:right;';
  const counter = el('div', 'label');
  counter.style.color = 'rgba(255,255,255,.7)';
  counter.textContent = `${idx + 1} / ${total}`;
  const roundBadge = el('div', 'turn-banner__round-badge');
  roundBadge.textContent = `🔁 Ronda ${currentRound}`;
  counterWrap.append(counter, roundBadge);

  wrap.append(nameWrap, counterWrap);
  return wrap;
}

// ─── Round expiry overlay ────────────────────────────────────────────────────

function buildRoundExpiryOverlay(effects: readonly RoundEffect[], store: GameStore): HTMLElement {
  const overlay = el('div', 'penalty-overlay');
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'round-expiry-title');

  const box = el('div', 'penalty-box');

  const icon = el('span', 'penalty-box__icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🎉';

  const title = el('h2', 'heading-lg');
  title.id = 'round-expiry-title';
  title.textContent = 'Acabou!';

  box.append(icon, title);

  const desc = el('p', 'body-md text-muted');
  desc.style.cssText = 'margin-top:var(--sp-2);margin-bottom:0;';
  desc.textContent =
    effects.length === 1 ?
      'O seguinte desafio chegou ao fim:'
    : 'Os seguintes desafios chegaram ao fim:';
  box.appendChild(desc);

  for (const effect of effects) {
    const effectEl = el('div', 'round-expiry__effect');
    effectEl.style.cssText =
      'margin-top:var(--sp-3);padding:var(--sp-3) var(--sp-4);background:var(--clr-surface-2);border-radius:var(--r-lg);border:1px solid var(--clr-border);font-size:0.9rem;line-height:1.4;color:var(--clr-text);';
    const playerName = store.state.players.find((p) => p.id === effect.playerId)?.name;
    if (playerName) {
      const nameTag = el('span', '');
      nameTag.style.cssText =
        'display:block;font-weight:600;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--clr-text-muted);margin-bottom:var(--sp-1);';
      nameTag.textContent = playerName;
      effectEl.appendChild(nameTag);
    }
    const textNode = document.createTextNode(effect.cardText);
    effectEl.appendChild(textNode);
    box.appendChild(effectEl);
  }

  const actions = el('div', 'penalty-box__actions');
  const okBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--lg btn--full');
  okBtn.style.marginTop = 'var(--sp-2)';
  okBtn.textContent = '✅  Entendido!';
  okBtn.setAttribute('aria-label', 'Confirmar que os efeitos terminaram');
  okBtn.addEventListener('click', () => store.update(Actions.acknowledgeRoundExpiry()));
  actions.appendChild(okBtn);
  box.appendChild(actions);

  overlay.appendChild(box);

  setTimeout(() => okBtn.focus(), 50);
  return overlay;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function el<T extends HTMLElement = HTMLDivElement>(tag: string, className?: string): T {
  const e = document.createElement(tag) as T;
  if (className) e.className = className;
  return e;
}
