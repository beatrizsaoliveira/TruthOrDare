import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import { TIER_META } from '../../types/index.js';

/**
 * Age-gate screen — displayed before tiers 2, 3, and 4.
 * Players must explicitly confirm that all participants are 18+.
 */
export function createAgeGateScreen(store: GameStore): HTMLElement {
  const { tier } = store.state;
  const meta = TIER_META.find(m => m.tier === tier);

  const screen = el('div', 'age-gate screen');
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-labelledby', 'ag-title');

  // ── Shield icon ───────────────────────────────────────────
  const shield = el('div', 'age-gate__shield');
  shield.setAttribute('aria-hidden', 'true');
  shield.textContent = '🔞';

  // ── Tier badge ────────────────────────────────────────────
  if (meta) {
    const badge = el('div', '');
    badge.style.cssText =
      `display:inline-flex;align-items:center;gap:8px;padding:.4rem 1rem;` +
      `border-radius:9999px;font-weight:700;font-size:.9rem;color:#fff;` +
      `background:${meta.gradient};`;
    badge.textContent = `${meta.emoji}  Tier ${meta.tier} · ${meta.label}`;
    screen.appendChild(shield);
    screen.appendChild(badge);
  }

  // ── Heading ───────────────────────────────────────────────
  const title = el('h1', 'heading-lg');
  title.id = 'ag-title';
  title.textContent = 'Confirmação de Idade';

  // ── Body text ─────────────────────────────────────────────
  const body = el('p', 'body-lg text-muted');
  body.style.maxWidth = '360px';
  body.textContent =
    'Este nível contém conteúdo para adultos. ' +
    'Ao continuar, confirmas que TODOS os jogadores presentes têm 18 anos ou mais.';

  // ── Warning alert ─────────────────────────────────────────
  const warn = el('div', 'alert alert--warn');
  warn.setAttribute('role', 'alert');
  warn.innerHTML =
    '<span aria-hidden="true">⚠️</span>' +
    '<span>Nunca pressiones alguém a participar em desafios com os quais não se sinta confortável.</span>';
  warn.style.maxWidth = '400px';
  warn.style.textAlign = 'left';

  // ── Buttons ───────────────────────────────────────────────
  const actions = el('div', 'stack stack--3');
  actions.style.width = '100%';
  actions.style.maxWidth = '360px';

  const confirmBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--lg btn--full');
  confirmBtn.textContent = '✅  Confirmo — todos temos +18 anos';
  confirmBtn.addEventListener('click', () => store.update(Actions.confirmAge()));

  const backBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
  backBtn.textContent = '← Voltar';
  backBtn.addEventListener('click', () => store.update(Actions.goBack()));

  actions.append(confirmBtn, backBtn);
  screen.append(title, body, warn, actions);
  return screen;
}

function el<T extends HTMLElement = HTMLDivElement>(tag: string, className?: string): T {
  const e = document.createElement(tag) as T;
  if (className) e.className = className;
  return e;
}
