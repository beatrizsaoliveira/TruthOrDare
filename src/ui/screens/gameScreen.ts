import { formatCardText } from '../../engine/genderParser.js';
import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import type { Card, Player } from '../../types/index.js';

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

    // Fallback
    return el('div', 'screen');
}

// ─── "Selecting" phase ────────────────────────────────────────────────────────

function buildSelectingScreen(store: GameStore): HTMLElement {
    const { players, currentPlayerIndex } = store.state;
    const currentPlayer = players[currentPlayerIndex] as Player;

    const screen = el('div', 'screen');

    // ── Turn banner ───────────────────────────────────────────
    const banner = el('div', 'turn-banner');
    const bannerLabel = el('div', 'turn-banner__label');
    bannerLabel.textContent = 'É a vez de';
    const bannerName = el('h1', 'turn-banner__name');
    bannerName.textContent = currentPlayer.name;
    banner.append(bannerLabel, bannerName);

    // ── Player dots ───────────────────────────────────────────
    const dotsRow = el('div', 'container');
    dotsRow.style.cssText = 'padding-top:1rem;padding-bottom:.5rem;';
    const dots = el('div', 'player-dots');
    dots.setAttribute('aria-label', 'Turno dos jogadores');
    players.forEach((p, i) => {
        const dot = el(
            'div',
            `player-dot${i === currentPlayerIndex ? ' player-dot--active' : ''}`
        );
        dot.setAttribute('title', p.name);
        dot.setAttribute(
            'aria-label',
            i === currentPlayerIndex ? `${p.name} (turno atual)` : p.name
        );
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
    truthBtn.addEventListener('click', () =>
        store.update(Actions.chooseCardType('truth'))
    );

    const dareBtn = el<HTMLButtonElement>('button', 'btn btn--dare');
    dareBtn.innerHTML = '<span aria-hidden="true">🔥</span>DESAFIO';
    dareBtn.setAttribute('aria-label', 'Desafio — receber um desafio');
    dareBtn.addEventListener('click', () =>
        store.update(Actions.chooseCardType('dare'))
    );

    choiceBtns.append(truthBtn, dareBtn);
    container.append(prompt, choiceBtns);
    main.appendChild(container);

    // ── Footer ────────────────────────────────────────────────
    const footer = el('footer', 'container pb-safe');
    footer.style.cssText =
        'padding-top:.75rem;padding-bottom:var(--dock-clearance);';
    const endBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--sm');
    endBtn.style.cssText = 'width:100%;color:var(--clr-text-muted);';
    endBtn.textContent = 'Terminar Jogo';
    endBtn.setAttribute('aria-label', 'Terminar o jogo e voltar ao início');
    endBtn.addEventListener('click', () => {
        if (confirm('Tens a certeza que queres terminar o jogo?')) {
            store.update(Actions.endGame());
        }
    });
    footer.appendChild(endBtn);

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
    const targetPlayer = currentTargetPlayerId
        ? players.find((p) => p.id === currentTargetPlayerId)
        : undefined;

    const screen = el('div', 'screen');

    if (showingPenalty && currentCard) {
        return buildPenaltyOverlayInScreen(screen, currentCard, store);
    }

    // ── Turn banner (compact) ─────────────────────────────────
    const banner = buildCompactBanner(
        currentPlayer,
        currentPlayerIndex,
        players.length
    );
    screen.appendChild(banner);

    // ── Card ──────────────────────────────────────────────────
    const main = el('main', '');
    main.style.cssText =
        'flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:1.5rem 0;overflow-y:auto;overflow-x:hidden;';

    const container = el('div', 'container stack stack--5');

    if (currentCard) {
        const cardEl = buildGameCard(currentCard, currentPlayer, targetPlayer);
        container.appendChild(cardEl);
    }

    main.appendChild(container);

    // ── Action buttons ────────────────────────────────────────
    const footer = el('footer', 'container stack stack--3 pb-safe');
    footer.style.cssText =
        'padding-top:1rem;padding-bottom:var(--dock-clearance);';

    const acceptBtn = el<HTMLButtonElement>(
        'button',
        'btn btn--primary btn--full btn--lg'
    );
    acceptBtn.innerHTML = '✅  Feito!';
    acceptBtn.setAttribute(
        'aria-label',
        'Marquei como feito, passar para o próximo jogador'
    );
    acceptBtn.addEventListener('click', () =>
        store.update(Actions.acceptCard())
    );

    footer.appendChild(acceptBtn);

    if (currentCard && (currentCard.shots !== null || !penaltiesEnabled)) {
        const refuseBtn = el<HTMLButtonElement>(
            'button',
            'btn btn--ghost btn--full'
        );
        const shotsHint =
            penaltiesEnabled && currentCard.shots
                ? ` (${currentCard.shots} shots)`
                : '';
        refuseBtn.innerHTML = `❌  Recusar${shotsHint}`;
        refuseBtn.setAttribute('aria-label', `Recusar o desafio${shotsHint}`);
        refuseBtn.addEventListener('click', () =>
            store.update(Actions.refuseCard())
        );
        footer.appendChild(refuseBtn);
    }

    screen.append(main, footer);
    return screen;
}

// ─── Game card ────────────────────────────────────────────────────────────────

function buildGameCard(
    card: Card,
    activePlayer: Player,
    targetPlayer?: Player
): HTMLElement {
    const cardEl = el('div', `game-card game-card--${card.type}`);
    cardEl.setAttribute('role', 'article');
    cardEl.setAttribute(
        'aria-label',
        card.type === 'truth' ? 'Carta de verdade' : 'Carta de desafio'
    );

    const badge = el(
        'div',
        `game-card__type-badge game-card__type-badge--${card.type}`
    );
    badge.innerHTML =
        card.type === 'truth'
            ? '<span aria-hidden="true">🤔</span> Verdade'
            : '<span aria-hidden="true">🔥</span> Desafio';

    const textEl = el('p', 'game-card__text');
    const formatted = formatCardText(card.rawText, activePlayer, targetPlayer);
    textEl.innerHTML = formatted;

    cardEl.append(badge, textEl);

    if (card.shots !== null) {
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
    store: GameStore
): HTMLElement {
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

    const desc = el('p', 'body-lg text-muted');
    desc.textContent = 'Penalização:';

    const shotsEl = el('div', 'penalty-box__shots');
    shotsEl.textContent = `${card.shots ?? 0}`;
    shotsEl.setAttribute('aria-label', `${card.shots ?? 0} shots`);

    const unit = el('p', 'heading-md');
    unit.textContent = `shot${(card.shots ?? 0) > 1 ? 's' : ''}`;

    const doneBtn = el<HTMLButtonElement>(
        'button',
        'btn btn--primary btn--lg btn--full'
    );
    doneBtn.style.marginTop = '1.5rem';
    doneBtn.textContent = '✅  Feito, bebi!';
    doneBtn.addEventListener('click', () =>
        store.update(Actions.dismissPenalty())
    );

    box.append(icon, title, desc, shotsEl, unit, doneBtn);
    overlay.appendChild(box);

    // Append overlay on top of existing screen content
    screen.style.position = 'relative';
    screen.appendChild(overlay);

    // Focus management
    setTimeout(() => doneBtn.focus(), 50);

    return screen;
}

// ─── Compact banner ───────────────────────────────────────────────────────────

function buildCompactBanner(
    player: Player,
    idx: number,
    total: number
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

    const counter = el('div', 'label');
    counter.style.color = 'rgba(255,255,255,.7)';
    counter.textContent = `${idx + 1} / ${total}`;

    wrap.append(nameWrap, counter);
    return wrap;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function el<T extends HTMLElement = HTMLDivElement>(
    tag: string,
    className?: string
): T {
    const e = document.createElement(tag) as T;
    if (className) e.className = className;
    return e;
}
