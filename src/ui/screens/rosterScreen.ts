import { sexLabel } from '../../engine/cardFormatter.js';
import type { GameStore } from '../../state/store.js';
import { showConfirm } from '../confirmModal.js';
import { Actions, loadSavedPlayers } from '../../state/store.js';
import type { Player } from '../../types/index.js';
import { createGitHubLink } from '../domHelpers.js';

const AVATAR_COLORS = [
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

export function createRosterScreen(store: GameStore): HTMLElement {
  const { tier } = store.state;
  const savedPlayers = loadSavedPlayers();
  const hasPlayers = savedPlayers.length > 0;

  const screen = el('div', 'screen');

  // ── Header ────────────────────────────────────────────────
  const header = el('header', 'app-header');
  const backBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--sm');
  backBtn.textContent = '← Voltar';
  backBtn.setAttribute('aria-label', 'Voltar ao início');
  backBtn.addEventListener('click', () => store.update(Actions.goBack()));
  const headerTitle = el('div', 'heading-sm');
  headerTitle.textContent = `Tier ${tier ?? ''} · Jogadores`;
  const actions = el('div', 'app-header__actions');
  actions.appendChild(createGitHubLink());

  header.append(backBtn, headerTitle, actions);

  // ── Main ──────────────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1; min-height:0; padding-top:1.5rem; padding-bottom:var(--dock-clearance); overflow-y:auto; overflow-x:hidden;';

  const container = el('div', 'container container--wide stack stack--6');

  const heading = el('h2', 'heading-md');
  heading.textContent = 'Jogadores Guardados';

  if (hasPlayers) {
    const n = savedPlayers.length;
    const desc = el('p', 'body-sm text-muted');
    desc.textContent = `${n} jogador${n === 1 ? '' : 'es'} encontrado${n === 1 ? '' : 's'}. Continuar com estes jogadores?`;

    const list = buildGroupedRosterList(savedPlayers);

    const useBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--xl btn--full');
    useBtn.textContent = '✓  Usar estes jogadores';
    useBtn.addEventListener('click', () => store.update(Actions.useRoster(savedPlayers)));

    const skipBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
    skipBtn.textContent = 'Começar do zero';
    skipBtn.addEventListener('click', () => {
      showConfirm({
        title: 'Começar do Zero',
        message: 'Tens a certeza? Os jogadores guardados serão ignorados e começarás do zero.',
        confirmLabel: 'Começar do Zero',
        danger: true,
      }).then((ok) => {
        if (!ok) return;
        store.update(Actions.skipRoster());
      });
    });

    container.append(heading, desc, list, useBtn, skipBtn);
  } else {
    const empty = el('p', 'body-sm text-muted');
    empty.textContent = 'Ainda não há jogadores guardados.';

    const continueBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--xl btn--full');
    continueBtn.textContent = 'Adicionar jogadores →';
    continueBtn.addEventListener('click', () => store.update(Actions.skipRoster()));

    container.append(heading, empty, continueBtn);
  }

  main.appendChild(container);
  screen.append(header, main);
  return screen;
}

// ─── Grouped player list ──────────────────────────────────────────────────────

function buildGroupedRosterList(players: readonly Player[]): HTMLElement {
  type CoupleEntry = { a: Player; aIdx: number; b: Player; bIdx: number };
  const rendered = new Set<string>();
  const coupleGroups: CoupleEntry[] = [];
  const singles: Array<{ player: Player; idx: number }> = [];

  players.forEach((player, idx) => {
    if (rendered.has(player.id)) return;
    rendered.add(player.id);
    const partnerIdx = player.partnerId ? players.findIndex((p) => p.id === player.partnerId) : -1;
    const partner = partnerIdx >= 0 ? (players[partnerIdx] ?? null) : null;
    if (partner && !rendered.has(partner.id)) {
      rendered.add(partner.id);
      coupleGroups.push({
        a: player,
        aIdx: idx,
        b: partner,
        bIdx: partnerIdx,
      });
    } else {
      singles.push({ player, idx });
    }
  });

  const list = el('ul', 'stack stack--3');
  const hasBoth = coupleGroups.length > 0 && singles.length > 0;

  if (coupleGroups.length > 0) {
    if (hasBoth) {
      const lbl = el('li', 'player-group-label');
      lbl.textContent = 'Casais';
      list.appendChild(lbl);
    }
    coupleGroups.forEach(({ a, aIdx, b, bIdx }) => {
      const group = el('li', 'player-couple-group');
      group.appendChild(buildRosterChip(a, aIdx, true));
      group.appendChild(buildCoupleConnector(true));
      group.appendChild(buildRosterChip(b, bIdx, true));
      list.appendChild(group);
    });
  }

  if (singles.length > 0) {
    if (hasBoth) {
      const lbl = el('li', 'player-group-label');
      lbl.textContent = 'Individuais';
      list.appendChild(lbl);
    }
    singles.forEach(({ player, idx }) => {
      list.appendChild(buildRosterChip(player, idx));
    });
  }

  return list;
}

// ─── Chip (read-only) ─────────────────────────────────────────────────────────

function buildRosterChip(player: Player, idx: number, asDiv = false): HTMLElement {
  const li = el(asDiv ? 'div' : 'li', 'player-chip');

  const avatar = el('div', 'player-chip__avatar');
  avatar.style.background = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? '#7C3AED';
  avatar.textContent = player.name.charAt(0).toUpperCase();
  avatar.setAttribute('aria-hidden', 'true');

  const info = el('div', 'player-chip__info');

  const name = el('div', 'player-chip__name');
  name.textContent = player.name;

  const metaParts: string[] = [];
  if (player.sex) metaParts.push(sexLabel(player.sex));
  const meta = el('div', 'player-chip__meta');
  meta.textContent = metaParts.join(' · ') || '—';

  info.append(name, meta);
  li.append(avatar, info);
  return li;
}

function buildCoupleConnector(asDiv = false): HTMLElement {
  const container = el(asDiv ? 'div' : 'li', 'player-couple-connector');
  container.setAttribute('aria-hidden', 'true');
  const lineA = el('span', 'player-couple-connector__line');
  const heart = el('span', '');
  heart.textContent = '❤';
  const lineB = el('span', 'player-couple-connector__line');
  container.append(lineA, heart, lineB);
  return container;
}

function el<T extends HTMLElement = HTMLDivElement>(tag: string, className?: string): T {
  const e = document.createElement(tag) as T;
  if (className) e.className = className;
  return e;
}
