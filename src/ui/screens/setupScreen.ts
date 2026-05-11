import { orientationLabel, relationshipLabel, sexLabel } from '../../engine/genderParser.js';
import type { GameStore } from '../../state/store.js';
import { Actions } from '../../state/store.js';
import type {
  Orientation,
  Player,
  RelationshipStatus,
  Sex,
  TargetSex,
  Tier,
} from '../../types/index.js';

/** Colour palette rotated through player avatars */
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

export function createSetupScreen(store: GameStore): HTMLElement {
  const { tier } = store.state;
  if (!tier) return el('div');

  const screen = el('div', 'screen');

  // ── Header ────────────────────────────────────────────────
  const header = el('header', 'app-header');
  const backBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--sm');
  backBtn.textContent = '← Voltar';
  backBtn.setAttribute('aria-label', 'Voltar ao início');
  backBtn.addEventListener('click', () => store.update(Actions.goBack()));

  const headerTitle = el('div', 'heading-sm');
  headerTitle.textContent = `Tier ${tier} · Jogadores`;
  header.append(backBtn, headerTitle);

  // ── Main content ──────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1; min-height:0; padding: 1.5rem 0 5rem; overflow-y:auto; overflow-x:hidden;';

  const container = el('div', 'container container--wide stack stack--6');

  // Player form
  const formSection = buildPlayerForm(tier, store);

  // Penalties toggle (Tier 2+)
  const penaltiesSection = tier >= 2 ? buildPenaltyToggle(store) : null;

  // Player list
  const listSection = buildPlayerList(store);

  // Start button
  const startSection = buildStartButton(store);

  container.append(formSection, listSection);
  if (penaltiesSection) container.appendChild(penaltiesSection);
  container.appendChild(startSection);
  main.appendChild(container);

  screen.append(header, main);

  // Re-render list and start button reactively when players change
  // (the form itself is static after mount)
  store.subscribe(state => {
    if (state.phase !== 'setup') return;
    updatePlayerList(listSection, store);
    updateStartButton(startSection, store);
  });

  return screen;
}

// ─── Player Form ──────────────────────────────────────────────────────────────

function buildPlayerForm(tier: Tier, store: GameStore): HTMLElement {
  const section = el('section', 'stack stack--4');

  const title = el('h2', 'heading-md');
  title.textContent = 'Adicionar Jogador';

  const form = el<HTMLFormElement>('form', 'stack stack--4');
  form.setAttribute('novalidate', '');

  // ── Name ─────────────────────────────────────────────────
  const nameGroup = el('div', 'form-group');
  const nameLabel = el<HTMLLabelElement>('label', 'form-label');
  nameLabel.htmlFor = 'player-name';
  nameLabel.textContent = 'Nome';
  const nameInput = el<HTMLInputElement>('input', 'form-input');
  nameInput.id = 'player-name';
  nameInput.type = 'text';
  nameInput.placeholder = 'Ex: João';
  nameInput.autocomplete = 'off';
  nameInput.maxLength = 32;
  nameGroup.append(nameLabel, nameInput);
  form.appendChild(nameGroup);

  // ── Sex (Tier 2+) ─────────────────────────────────────────
  let sexInputs: { m: HTMLInputElement; f: HTMLInputElement } | null = null;
  if (tier >= 2) {
    const sexGroup = buildRadioGroup<Sex>('player-sex', 'Sexo biológico', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
    ]);
    sexInputs = {
      m: sexGroup.querySelector<HTMLInputElement>('input[value="male"]') as HTMLInputElement,
      f: sexGroup.querySelector<HTMLInputElement>('input[value="female"]') as HTMLInputElement,
    };
    form.appendChild(sexGroup);
  }

  // ── Tier 3+ fields ────────────────────────────────────────
  let orientationInputs: NodeListOf<HTMLInputElement> | null = null;
  let statusSelect: HTMLSelectElement | null = null;
  let partnerGroup: HTMLElement | null = null;
  let partnerSelect: HTMLSelectElement | null = null;
  let openWrap: HTMLElement | null = null;
  let openInput: HTMLInputElement | null = null;
  let targetSexGroup: HTMLElement | null = null;

  if (tier >= 3) {
    // Orientation
    const oriGroup = buildRadioGroup<Orientation>('player-ori', 'Orientação sexual', [
      { value: 'hetero', label: '⚤ Hetero' },
      { value: 'homo', label: '⚥ Homo' },
      { value: 'bi', label: '⚧ Bi' },
    ]);
    orientationInputs = oriGroup.querySelectorAll('input');
    form.appendChild(oriGroup);

    // Relationship status
    const relGroup = el('div', 'form-group');
    const relLabel = el<HTMLLabelElement>('label', 'form-label');
    relLabel.htmlFor = 'player-status';
    relLabel.textContent = 'Estado de relação';
    statusSelect = el<HTMLSelectElement>('select', 'form-select');
    statusSelect.id = 'player-status';
    statusSelect.innerHTML = `
      <option value="single">Solteiro/a</option>
      <option value="open">Relação Aberta</option>
      <option value="closed">Relação Exclusiva</option>
    `;
    relGroup.append(relLabel, statusSelect);
    form.appendChild(relGroup);

    // Partner select (shown conditionally)
    partnerGroup = el('div', 'form-group');
    partnerGroup.style.display = 'none';
    const partnerLabel = el<HTMLLabelElement>('label', 'form-label');
    partnerLabel.htmlFor = 'player-partner';
    partnerLabel.textContent = 'Parceiro/a no jogo';
    partnerSelect = el<HTMLSelectElement>('select', 'form-select');
    partnerSelect.id = 'player-partner';
    partnerGroup.append(partnerLabel, partnerSelect);
    form.appendChild(partnerGroup);

    // Open to outside
    openWrap = el('div', 'toggle-wrap');
    openWrap.style.display = 'none';
    const openLabelDiv = el('div', 'toggle-label');
    openLabelDiv.innerHTML =
      '<div class="toggle-label__title">Aberto/a a interações externas</div>' +
      '<div class="toggle-label__desc">Aceita desafios com jogadores fora da relação</div>';

    const openToggle = el('label', 'toggle');
    openInput = el<HTMLInputElement>('input', '');
    openInput.type = 'checkbox';
    openInput.id = 'player-open';
    const openTrack = el('span', 'toggle__track');
    openToggle.append(openInput, openTrack);
    openWrap.append(openLabelDiv, openToggle);
    form.appendChild(openWrap);

    // Target sex
    targetSexGroup = buildRadioGroup<TargetSex>('player-targetsex', 'Sexo alvo para interações', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
      { value: 'both', label: '⚥ Ambos' },
    ]);
    targetSexGroup.style.display = 'none';
    form.appendChild(targetSexGroup);

    // Conditional visibility logic
    function updateConditionalFields() {
      const status = (statusSelect?.value ?? 'single') as RelationshipStatus;
      const showPartner = status === 'open' || status === 'closed';
      const showOpen = status !== 'closed';

      if (partnerGroup) partnerGroup.style.display = showPartner ? '' : 'none';
      if (openWrap) openWrap.style.display = showOpen ? '' : 'none';

      // Target sex only when open to outside or single
      const isOpenToOutside = openInput?.checked ?? false;
      if (targetSexGroup) {
        targetSexGroup.style.display =
          status === 'single' || (showOpen && isOpenToOutside) ? '' : 'none';
      }

      // Populate partner dropdown with current players
      if (partnerSelect) {
        populatePartnerSelect(partnerSelect, store);
      }
    }

    statusSelect.addEventListener('change', updateConditionalFields);
    openInput.addEventListener('change', updateConditionalFields);
    updateConditionalFields();

    // Update partner list whenever a player is added/removed
    store.subscribe(state => {
      if (state.phase === 'setup' && partnerGroup?.style.display !== 'none' && partnerSelect) {
        populatePartnerSelect(partnerSelect, store);
      }
    });
  }

  // ── Submit button ─────────────────────────────────────────
  const addBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--full');
  addBtn.type = 'submit';
  addBtn.textContent = '+ Adicionar jogador';
  form.appendChild(addBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    // Determine sex — fall back to omitting the field entirely when unchecked
    let sexChecked: Sex | null = null;
    if (sexInputs?.m.checked) sexChecked = 'male';
    else if (sexInputs?.f.checked) sexChecked = 'female';

    // Build an accumulator with mutable optional fields (avoids readonly constraint)
    type ExtraFields = {
      sex?: Sex;
      orientation?: Orientation;
      relationshipStatus?: RelationshipStatus;
      partnerId?: string | null;
      openToOutside?: boolean;
      targetSex?: TargetSex;
    };
    const extras: ExtraFields = {};

    if (sexChecked !== null) extras.sex = sexChecked;

    if (tier >= 3) {
      const orientation = getCheckedValue<Orientation>(
        orientationInputs ?? emptyNodeList<HTMLInputElement>(),
      );
      if (orientation !== undefined) extras.orientation = orientation;

      extras.relationshipStatus = (statusSelect?.value as RelationshipStatus) ?? 'single';
      extras.partnerId = partnerSelect?.value || null;
      extras.openToOutside = openInput?.checked ?? false;
      extras.targetSex =
        getCheckedValue<TargetSex>(
          targetSexGroup?.querySelectorAll('input') ?? emptyNodeList<HTMLInputElement>(),
        ) ?? 'both';
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name,
      ...extras,
    };

    store.update(Actions.addPlayer(player));
    form.reset();
    nameInput.focus();
  });

  section.append(title, form);
  return section;
}

function populatePartnerSelect(select: HTMLSelectElement, store: GameStore): void {
  const current = select.value;
  select.innerHTML = '<option value="">— Nenhum / seleciona depois —</option>';
  for (const p of store.state.players) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  }
  if (current) select.value = current;
}

// ─── Player List ──────────────────────────────────────────────────────────────

function buildPlayerList(store: GameStore): HTMLElement {
  const section = el('section', 'stack stack--3');
  section.setAttribute('aria-label', 'Jogadores adicionados');
  updatePlayerList(section, store);
  return section;
}

function updatePlayerList(section: HTMLElement, store: GameStore): void {
  section.innerHTML = '';
  const { players, tier } = store.state;

  const heading = el('h2', 'heading-sm');
  heading.textContent = `Jogadores (${players.length})`;

  if (players.length === 0) {
    const empty = el('p', 'body-sm text-muted');
    empty.textContent = 'Adiciona pelo menos 2 jogadores para começar.';
    section.append(heading, empty);
    return;
  }

  const list = el('ul', 'stack stack--2');
  list.setAttribute('aria-label', 'Lista de jogadores');

  players.forEach((player, idx) => {
    const chip = buildPlayerChip(player, idx, tier ?? 1, store);
    list.appendChild(chip);
  });

  section.append(heading, list);
}

function buildPlayerChip(player: Player, idx: number, tier: Tier, store: GameStore): HTMLElement {
  const li = el('li', 'player-chip');

  const avatar = el('div', 'player-chip__avatar');
  avatar.style.background = AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? '#7C3AED';
  avatar.textContent = player.name.charAt(0).toUpperCase();
  avatar.setAttribute('aria-hidden', 'true');

  const info = el('div', 'player-chip__info');
  const name = el('div', 'player-chip__name');
  name.textContent = player.name;

  const metaParts: string[] = [];
  if (tier >= 2 && player.sex) metaParts.push(sexLabel(player.sex));
  if (tier >= 3) {
    if (player.orientation) metaParts.push(orientationLabel(player.orientation));
    if (player.relationshipStatus) metaParts.push(relationshipLabel(player.relationshipStatus));
  }
  const meta = el('div', 'player-chip__meta');
  meta.textContent = metaParts.join(' · ') || '—';

  info.append(name, meta);

  const removeBtn = el<HTMLButtonElement>('button', 'player-chip__remove');
  removeBtn.setAttribute('aria-label', `Remover ${player.name}`);
  removeBtn.innerHTML = '✕';
  removeBtn.addEventListener('click', () => store.update(Actions.removePlayer(player.id)));

  li.append(avatar, info, removeBtn);
  return li;
}

// ─── Penalties toggle ─────────────────────────────────────────────────────────

function buildPenaltyToggle(store: GameStore): HTMLElement {
  const wrap = el('div', 'toggle-wrap');

  const labelDiv = el('div', 'toggle-label');
  labelDiv.innerHTML =
    '<div class="toggle-label__title">🍺 Ativar penalizações</div>' +
    '<div class="toggle-label__desc">Quem recusar tem de beber os shots indicados na carta</div>';

  const toggleLabel = el<HTMLLabelElement>('label', 'toggle');
  const toggleInput = el<HTMLInputElement>('input', '');
  toggleInput.type = 'checkbox';
  toggleInput.id = 'penalties-toggle';
  toggleInput.checked = store.state.penaltiesEnabled;
  toggleInput.addEventListener('change', () =>
    store.update(Actions.setPenalties(toggleInput.checked)),
  );
  const track = el('span', 'toggle__track');
  toggleLabel.append(toggleInput, track);

  wrap.append(labelDiv, toggleLabel);
  return wrap;
}

// ─── Start button ─────────────────────────────────────────────────────────────

function buildStartButton(store: GameStore): HTMLElement {
  const section = el('div', 'stack stack--3 pb-safe');
  const btn = el<HTMLButtonElement>('button', 'btn btn--primary btn--xl btn--full');
  btn.textContent = '🎮  Iniciar Jogo';
  btn.disabled = store.state.players.length < 2;
  btn.addEventListener('click', () => {
    if (store.state.players.length < 2) return;
    store.update(Actions.startGame());
  });
  section.appendChild(btn);
  return section;
}

function updateStartButton(section: HTMLElement, store: GameStore): void {
  const btn = section.querySelector<HTMLButtonElement>('button');
  if (btn) btn.disabled = store.state.players.length < 2;
}

// ─── Radio group helper ───────────────────────────────────────────────────────

function buildRadioGroup<T extends string>(
  name: string,
  label: string,
  options: Array<{ value: T; label: string }>,
): HTMLElement {
  const group = el('div', 'form-group');

  const labelEl = el('div', 'form-label');
  labelEl.textContent = label;

  const radioRow = el('div', 'radio-group');
  radioRow.setAttribute('role', 'group');
  radioRow.setAttribute('aria-label', label);

  options.forEach(({ value, label: optLabel }, i) => {
    const wrapper = el('div', 'radio-option');
    const input = el<HTMLInputElement>('input', '');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.id = `${name}-${value}`;
    if (i === 0) input.defaultChecked = true;

    const lbl = el<HTMLLabelElement>('label', '');
    lbl.htmlFor = input.id;
    lbl.textContent = optLabel;

    wrapper.append(input, lbl);
    radioRow.appendChild(wrapper);
  });

  group.append(labelEl, radioRow);
  return group;
}

function getCheckedValue<T extends string>(inputs: NodeListOf<HTMLInputElement>): T | undefined {
  for (const input of Array.from(inputs)) {
    if (input.checked) return input.value as T;
  }
  return undefined;
}

function el<T extends HTMLElement = HTMLDivElement>(tag: string, className?: string): T {
  const e = document.createElement(tag) as T;
  if (className) e.className = className;
  return e;
}

/** Returns an empty NodeList of the given type (used as a fallback). */
function emptyNodeList<T extends Element>(): NodeListOf<T> {
  return document.createDocumentFragment().querySelectorAll<T>('__never__');
}
