import { orientationLabel, relationshipLabel, sexLabel } from '../../engine/cardFormatter.js';
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
import { showConfirm } from '../confirmModal.js';
import { createGitHubLink } from '../domHelpers.js';
import { animateLiquidToggle, buildLiquidToggle } from '../settingsPanel.js';

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
  const actions = el('div', 'app-header__actions');
  actions.appendChild(createGitHubLink());

  header.append(backBtn, headerTitle, actions);

  // ── Body ──────────────────────────────────────────────────
  const main = el('main', '');
  main.style.cssText =
    'flex:1; min-height:0; padding-top: 1.5rem; padding-bottom: var(--dock-clearance); overflow-y:auto; overflow-x:hidden;';

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
  store.subscribe((state) => {
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
  let bioWrap: HTMLElement | null = null;
  if (tier >= 2) {
    const sexGroup = buildRadioGroup<Sex>('player-sex', 'Sexo biológico', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
    ]);
    sexInputs = {
      m: sexGroup.querySelector<HTMLInputElement>('input[value="male"]') as HTMLInputElement,
      f: sexGroup.querySelector<HTMLInputElement>('input[value="female"]') as HTMLInputElement,
    };
    bioWrap = el('div', 'field-group-wrap field-group-wrap--inline');
    bioWrap.appendChild(sexGroup);
    form.appendChild(bioWrap);
  }

  // ── Couple status (Tier 2 only) ──────────────────────────────────────────
  let tier2CoupleRadio: HTMLInputElement | null = null;
  let tier2PartnerGroup: HTMLElement | null = null;
  let tier2PartnerSelect: HTMLSelectElement | null = null;

  if (tier === 2) {
    const coupleStatusGroup = buildRadioGroup<'single' | 'couple'>(
      'player-couple-status',
      'Estado',
      [
        { value: 'single', label: '🙋 Solteiro/a' },
        { value: 'couple', label: '💑 Em casal' },
      ],
    );
    tier2CoupleRadio = coupleStatusGroup.querySelector<HTMLInputElement>(
      'input[value="couple"]',
    ) as HTMLInputElement;

    tier2PartnerGroup = el('div', 'form-group');
    tier2PartnerGroup.style.display = 'none';
    const t2PartnerLabel = el<HTMLLabelElement>('label', 'form-label');
    t2PartnerLabel.htmlFor = 'player-partner-t2';
    t2PartnerLabel.textContent = 'Parceiro/a no jogo';
    tier2PartnerSelect = el<HTMLSelectElement>('select', 'form-select');
    tier2PartnerSelect.id = 'player-partner-t2';
    tier2PartnerGroup.append(t2PartnerLabel, tier2PartnerSelect);

    const t2CoupleWrap = el('div', 'field-group-wrap');
    t2CoupleWrap.append(coupleStatusGroup, tier2PartnerGroup);
    form.appendChild(t2CoupleWrap);

    coupleStatusGroup.addEventListener('change', () => {
      const isCoupled = tier2CoupleRadio?.checked ?? false;
      if (tier2PartnerGroup) tier2PartnerGroup.style.display = isCoupled ? '' : 'none';
      if (isCoupled && tier2PartnerSelect) populatePartnerSelect(tier2PartnerSelect, store);
    });

    store.subscribe((state) => {
      if (
        state.phase === 'setup' &&
        tier2PartnerGroup?.style.display !== 'none' &&
        tier2PartnerSelect
      ) {
        populatePartnerSelect(tier2PartnerSelect, store);
      }
    });
  }

  // ── Tier 3+ fields ────────────────────────────────────────
  let orientationInputs: NodeListOf<HTMLInputElement> | null = null;
  let statusSelect: HTMLSelectElement | null = null;
  let partnerGroup: HTMLElement | null = null;
  let partnerSelect: HTMLSelectElement | null = null;
  let openWrap: HTMLElement | null = null;
  let openLiquidToggle: HTMLButtonElement | null = null;
  let openChecked = false;
  let targetSexGroup: HTMLElement | null = null;

  if (tier >= 3) {
    // Defined first so all listeners below can safely reference it.
    // (Block-scoped function declarations are not hoisted in TS strict mode.)
    function updateConditionalFields() {
      const status = (statusSelect?.value ?? 'single') as RelationshipStatus;
      const showPartner = status === 'open' || status === 'closed';
      const showOpen = status !== 'closed';

      if (partnerGroup) partnerGroup.style.display = showPartner ? '' : 'none';
      if (openWrap) openWrap.style.display = showOpen ? '' : 'none';

      // Target sex only when the "open to outside" toggle is on
      if (targetSexGroup) {
        targetSexGroup.style.display = openChecked ? '' : 'none';
      }

      // Populate partner dropdown with current players
      if (partnerSelect) {
        populatePartnerSelect(partnerSelect, store);
      }
    }

    // Orientation
    const oriGroup = buildRadioGroup<Orientation>('player-ori', 'Orientação sexual', [
      { value: 'hetero', label: '⚤ Hetero' },
      { value: 'homo', label: '⚥ Homo' },
      { value: 'bi', label: '⚧ Bi' },
    ]);
    orientationInputs = oriGroup.querySelectorAll('input');
    (bioWrap ?? form).appendChild(oriGroup);

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
    const relWrap = el('div', 'field-group-wrap');
    relWrap.appendChild(relGroup);

    // Partner select (shown conditionally — grouped with status)
    partnerGroup = el('div', 'form-group');
    partnerGroup.style.display = 'none';
    const partnerLabel = el<HTMLLabelElement>('label', 'form-label');
    partnerLabel.htmlFor = 'player-partner';
    partnerLabel.textContent = 'Parceiro/a no jogo';
    partnerSelect = el<HTMLSelectElement>('select', 'form-select');
    partnerSelect.id = 'player-partner';
    partnerGroup.append(partnerLabel, partnerSelect);
    relWrap.appendChild(partnerGroup);
    form.appendChild(relWrap);

    // Open to outside (highlighted container — includes target sex when toggled)
    openWrap = el('div', 'toggle-wrap toggle-wrap--open');
    openWrap.style.display = 'none';
    const openRow = el('div', 'toggle-wrap__row');
    const openLabelDiv = el('div', 'toggle-label');
    openLabelDiv.innerHTML =
      '<div class="toggle-label__title">Aberto/a a interações externas</div>' +
      '<div class="toggle-label__desc">Pode participar em desafios com qualquer outro jogador</div>';

    openLiquidToggle = buildLiquidToggle('player-open', false);
    openLiquidToggle.addEventListener('click', () => {
      openChecked = !openChecked;
      openLiquidToggle!.setAttribute('aria-checked', String(openChecked));
      animateLiquidToggle(openLiquidToggle!, openChecked);
      updateConditionalFields();
    });
    openRow.append(openLabelDiv, openLiquidToggle);

    // Target sex (inside openWrap, shown only when toggle is on)
    targetSexGroup = buildRadioGroup<TargetSex>('player-targetsex', 'Sexo alvo para interações', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
      { value: 'both', label: '⚥ Ambos' },
    ]);
    targetSexGroup.style.display = 'none';
    openWrap.append(openRow, targetSexGroup);
    form.appendChild(openWrap);

    statusSelect.addEventListener('change', updateConditionalFields);
    updateConditionalFields();

    // Update partner list whenever a player is added/removed
    store.subscribe((state) => {
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

  form.addEventListener('submit', (e) => {
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

    if (tier === 2) {
      const isCoupled = tier2CoupleRadio?.checked ?? false;
      extras.partnerId = isCoupled ? tier2PartnerSelect?.value || null : null;
    }

    if (tier >= 3) {
      const orientation = getCheckedValue<Orientation>(
        orientationInputs ?? emptyNodeList<HTMLInputElement>(),
      );
      if (orientation !== undefined) extras.orientation = orientation;

      extras.relationshipStatus = (statusSelect?.value as RelationshipStatus) ?? 'single';
      extras.partnerId = partnerSelect?.value || null;
      extras.openToOutside = openChecked && extras.relationshipStatus !== 'closed';
      if (extras.openToOutside) {
        extras.targetSex =
          getCheckedValue<TargetSex>(
            targetSexGroup?.querySelectorAll('input') ?? emptyNodeList<HTMLInputElement>(),
          ) ?? 'both';
      }
    }

    const player: Player = {
      id: crypto.randomUUID(),
      name,
      ...extras,
    };

    store.update(Actions.addPlayer(player));
    form.reset();
    // Hide Tier 2 partner picker after reset (form.reset reverts radio to Solteiro/a).
    if (tier === 2 && tier2PartnerGroup) {
      tier2PartnerGroup.style.display = 'none';
    }
    // Reset open-to-outside toggle state and re-sync conditional fields.
    // We dispatch a 'change' event on the status select (which form.reset()
    // reverted to 'single') so the listener inside the if(tier>=3) block
    // — which is block-scoped and not reachable directly — re-evaluates
    // visibility correctly.
    if (tier >= 3) {
      openChecked = false;
      if (openLiquidToggle) {
        openLiquidToggle.setAttribute('aria-checked', 'false');
        animateLiquidToggle(openLiquidToggle, false);
      }
      statusSelect?.dispatchEvent(new Event('change'));
    }
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

function populatePartnerSelectExcluding(
  select: HTMLSelectElement,
  store: GameStore,
  excludeId: string,
): void {
  const current = select.value;
  select.innerHTML = '<option value="">— Nenhum / seleciona depois —</option>';
  for (const p of store.state.players) {
    if (p.id === excludeId) continue;
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

  const list = el('ul', 'stack stack--3');
  list.setAttribute('aria-label', 'Lista de jogadores');

  if (tier && tier >= 2) {
    type CoupleEntry = { a: Player; aIdx: number; b: Player; bIdx: number };
    const rendered = new Set<string>();
    const coupleGroups: CoupleEntry[] = [];
    const singles: Array<{ player: Player; idx: number }> = [];

    players.forEach((player, idx) => {
      if (rendered.has(player.id)) return;
      rendered.add(player.id);
      const partnerIdx =
        player.partnerId ? players.findIndex((p) => p.id === player.partnerId) : -1;
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

    const hasBoth = coupleGroups.length > 0 && singles.length > 0;

    if (coupleGroups.length > 0) {
      if (hasBoth) {
        const label = el('li', 'player-group-label');
        label.textContent = 'Casais';
        list.appendChild(label);
      }
      coupleGroups.forEach(({ a, aIdx, b, bIdx }) => {
        const group = el('li', 'player-couple-group');
        group.appendChild(buildPlayerChip(a, aIdx, tier, store, true));
        group.appendChild(buildCoupleConnector(true));
        group.appendChild(buildPlayerChip(b, bIdx, tier, store, true));
        list.appendChild(group);
      });
    }

    if (singles.length > 0) {
      if (hasBoth) {
        const label = el('li', 'player-group-label');
        label.textContent = 'Individuais';
        list.appendChild(label);
      }
      singles.forEach(({ player, idx }) => {
        list.appendChild(buildPlayerChip(player, idx, tier, store));
      });
    }
  } else {
    players.forEach((player, idx) => {
      list.appendChild(buildPlayerChip(player, idx, tier ?? 1, store));
    });
  }

  section.append(heading, list);
}

function buildPlayerChip(
  player: Player,
  idx: number,
  tier: Tier,
  store: GameStore,
  asDiv = false,
): HTMLElement {
  const li = el(asDiv ? 'div' : 'li', 'player-chip');

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
  if (tier >= 3 && player.openToOutside && player.targetSex) {
    meta.textContent = metaParts.join(' · ') || '—';
    const sep = document.createTextNode(' → ');
    const badge = el<HTMLSpanElement>('span', 'player-chip__target-badge');
    badge.textContent = targetSexLabel(player.targetSex);
    meta.append(sep, badge);
  } else {
    meta.textContent = metaParts.join(' · ') || '—';
  }

  info.append(name, meta);

  const editBtn = el<HTMLButtonElement>('button', 'player-chip__edit');
  editBtn.setAttribute('aria-label', `Editar ${player.name}`);
  editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  editBtn.addEventListener('click', () => openEditModal(player, tier, store));

  const removeBtn = el<HTMLButtonElement>('button', 'player-chip__remove');
  removeBtn.setAttribute('aria-label', `Remover ${player.name}`);
  removeBtn.innerHTML = '✕';
  removeBtn.addEventListener('click', () => {
    showConfirm({
      title: 'Remover Jogador',
      message: `Remover ${player.name} da lista de jogadores?`,
      confirmLabel: 'Remover',
      danger: true,
    }).then((ok) => {
      if (ok) store.update(Actions.removePlayer(player.id));
    });
  });

  const chipActions = el('div', 'player-chip__actions');
  chipActions.append(editBtn, removeBtn);

  li.append(avatar, info, chipActions);
  return li;
}

// ─── Edit Player Modal ────────────────────────────────────────────────────────

function openEditModal(player: Player, tier: Tier, store: GameStore): void {
  const modal = el('div', 'help-modal');
  modal.id = 'edit-player-modal';
  modal.setAttribute('inert', '');

  const backdrop = el('div', 'help-modal-backdrop');
  const panel = el('div', 'help-modal-panel');

  // All three are function declarations so they hoist within openEditModal and
  // can safely reference the let-variables below (which are initialised before
  // any close event can fire).
  function isDirty(): boolean {
    if (nameInput.value.trim() !== player.name) return true;
    if (tier >= 2) {
      const sexVal =
        sexInputs?.m.checked ? 'male'
        : sexInputs?.f.checked ? 'female'
        : null;
      if (sexVal !== (player.sex ?? null)) return true;
    }
    if (tier === 2) {
      const isCoupled = tier2CoupleRadio?.checked ?? false;
      const currentPartner = isCoupled ? tier2PartnerSelect?.value || null : null;
      if (currentPartner !== (player.partnerId ?? null)) return true;
    }
    if (tier >= 3) {
      const ori = getCheckedValue<Orientation>(
        orientationInputs ?? emptyNodeList<HTMLInputElement>(),
      );
      if (ori !== (player.orientation ?? 'hetero')) return true;
      if ((statusSelect?.value ?? 'single') !== (player.relationshipStatus ?? 'single'))
        return true;
      if ((partnerSelect?.value || null) !== (player.partnerId ?? null)) return true;
      if (openChecked !== (player.openToOutside ?? false)) return true;
      const tSex = getCheckedValue<TargetSex>(
        targetSexGroup?.querySelectorAll<HTMLInputElement>('input') ??
          emptyNodeList<HTMLInputElement>(),
      );
      if (tSex !== (player.targetSex ?? 'both')) return true;
    }
    return false;
  }

  function forceClose(): void {
    if (!modal.classList.contains('visible')) return;
    modal.classList.remove('visible');
    modal.setAttribute('inert', '');
    document.removeEventListener('keydown', handleKeyDown);
    setTimeout(() => modal.remove(), 300);
  }

  function closeModal(): void {
    if (isDirty()) {
      showConfirm({
        title: 'Alterações Não Guardadas',
        message: 'Tens alterações não guardadas. Queres mesmo fechar sem guardar?',
        confirmLabel: 'Fechar',
        danger: true,
      }).then((ok) => {
        if (!ok) return;
        forceClose();
      });
      return;
    }
    forceClose();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') closeModal();
  }

  // ── Header ────────────────────────────────────────────────
  const content = el('div', 'help-modal-content');
  const header = el('div', 'help-modal-header');
  const titleEl = el('span', 'help-modal-title');
  titleEl.textContent = `✏️  Editar ${player.name}`;
  const closeBtn = el<HTMLButtonElement>('button', 'modal-close-btn');
  closeBtn.setAttribute('aria-label', 'Fechar edição');
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener('click', closeModal);
  header.append(titleEl, closeBtn);

  // ── Scrollable body ───────────────────────────────────────
  const body = el('div', 'help-body');
  const form = el<HTMLFormElement>('form', 'stack stack--4');
  form.setAttribute('novalidate', '');

  // Name
  const nameGroup = el('div', 'form-group');
  const nameLabel = el<HTMLLabelElement>('label', 'form-label');
  nameLabel.htmlFor = 'edit-player-name';
  nameLabel.textContent = 'Nome';
  const nameInput = el<HTMLInputElement>('input', 'form-input');
  nameInput.id = 'edit-player-name';
  nameInput.type = 'text';
  nameInput.autocomplete = 'off';
  nameInput.maxLength = 32;
  nameInput.value = player.name;
  nameGroup.append(nameLabel, nameInput);
  form.appendChild(nameGroup);

  // Sex (Tier 2+)
  let sexInputs: { m: HTMLInputElement; f: HTMLInputElement } | null = null;
  let bioWrap: HTMLElement | null = null;
  if (tier >= 2) {
    const sexGroup = buildRadioGroup<Sex>('edit-sex', 'Sexo biológico', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
    ]);
    const mInput = sexGroup.querySelector<HTMLInputElement>(
      'input[value="male"]',
    ) as HTMLInputElement;
    const fInput = sexGroup.querySelector<HTMLInputElement>(
      'input[value="female"]',
    ) as HTMLInputElement;
    mInput.defaultChecked = false;
    fInput.defaultChecked = false;
    if (player.sex === 'male') {
      mInput.checked = true;
      mInput.defaultChecked = true;
    } else if (player.sex === 'female') {
      fInput.checked = true;
      fInput.defaultChecked = true;
    }
    sexInputs = { m: mInput, f: fInput };
    bioWrap = el('div', 'field-group-wrap field-group-wrap--inline');
    bioWrap.appendChild(sexGroup);
    form.appendChild(bioWrap);
  }

  // ── Couple status (Tier 2 only) ──────────────────────────────────────────
  let tier2CoupleRadio: HTMLInputElement | null = null;
  let tier2PartnerGroup: HTMLElement | null = null;
  let tier2PartnerSelect: HTMLSelectElement | null = null;

  if (tier === 2) {
    const coupleStatusGroup = buildRadioGroup<'single' | 'couple'>('edit-couple-status', 'Estado', [
      { value: 'single', label: '🙋 Solteiro/a' },
      { value: 'couple', label: '💑 Em casal' },
    ]);
    const coupleInput = coupleStatusGroup.querySelector<HTMLInputElement>(
      'input[value="couple"]',
    ) as HTMLInputElement;
    const singleInput = coupleStatusGroup.querySelector<HTMLInputElement>(
      'input[value="single"]',
    ) as HTMLInputElement;
    if (player.partnerId) {
      coupleInput.checked = true;
      coupleInput.defaultChecked = true;
      singleInput.checked = false;
      singleInput.defaultChecked = false;
    }
    tier2CoupleRadio = coupleInput;

    tier2PartnerGroup = el('div', 'form-group');
    tier2PartnerGroup.style.display = 'none';
    const t2PartnerLabel = el<HTMLLabelElement>('label', 'form-label');
    t2PartnerLabel.htmlFor = 'edit-partner-t2';
    t2PartnerLabel.textContent = 'Parceiro/a no jogo';
    tier2PartnerSelect = el<HTMLSelectElement>('select', 'form-select');
    tier2PartnerSelect.id = 'edit-partner-t2';
    tier2PartnerGroup.append(t2PartnerLabel, tier2PartnerSelect);

    const t2CoupleWrap = el('div', 'field-group-wrap');
    t2CoupleWrap.append(coupleStatusGroup, tier2PartnerGroup);
    form.appendChild(t2CoupleWrap);

    function updateTier2EditFields(): void {
      const isCoupled = tier2CoupleRadio?.checked ?? false;
      if (tier2PartnerGroup) tier2PartnerGroup.style.display = isCoupled ? '' : 'none';
      if (isCoupled && tier2PartnerSelect)
        populatePartnerSelectExcluding(tier2PartnerSelect, store, player.id);
    }

    coupleStatusGroup.addEventListener('change', updateTier2EditFields);
    updateTier2EditFields();

    if (tier2PartnerSelect && player.partnerId) {
      tier2PartnerSelect.value = player.partnerId;
    }
  }

  // Tier 3+ fields
  let orientationInputs: NodeListOf<HTMLInputElement> | null = null;
  let statusSelect: HTMLSelectElement | null = null;
  let partnerGroup: HTMLElement | null = null;
  let partnerSelect: HTMLSelectElement | null = null;
  let openWrap: HTMLElement | null = null;
  let openLiquidToggle: HTMLButtonElement | null = null;
  let openChecked = player.openToOutside ?? false;
  let targetSexGroup: HTMLElement | null = null;

  if (tier >= 3) {
    function updateConditionalFields(): void {
      const status = (statusSelect?.value ?? 'single') as RelationshipStatus;
      const showPartner = status === 'open' || status === 'closed';
      const showOpen = status !== 'closed';
      if (partnerGroup) partnerGroup.style.display = showPartner ? '' : 'none';
      if (openWrap) openWrap.style.display = showOpen ? '' : 'none';
      if (targetSexGroup) targetSexGroup.style.display = openChecked ? '' : 'none';
      if (partnerSelect) populatePartnerSelectExcluding(partnerSelect, store, player.id);
    }

    // Orientation
    const oriGroup = buildRadioGroup<Orientation>('edit-ori', 'Orientação sexual', [
      { value: 'hetero', label: '⚤ Hetero' },
      { value: 'homo', label: '⚥ Homo' },
      { value: 'bi', label: '⚧ Bi' },
    ]);
    orientationInputs = oriGroup.querySelectorAll('input');
    for (const inp of Array.from(orientationInputs)) {
      inp.defaultChecked = false;
      inp.checked = inp.value === (player.orientation ?? 'hetero');
      if (inp.checked) inp.defaultChecked = true;
    }
    (bioWrap ?? form).appendChild(oriGroup);

    // Relationship status
    const relGroup = el('div', 'form-group');
    const relLabel = el<HTMLLabelElement>('label', 'form-label');
    relLabel.htmlFor = 'edit-status';
    relLabel.textContent = 'Estado de relação';
    statusSelect = el<HTMLSelectElement>('select', 'form-select');
    statusSelect.id = 'edit-status';
    statusSelect.innerHTML = `
          <option value="single">Solteiro/a</option>
          <option value="open">Relação Aberta</option>
          <option value="closed">Relação Exclusiva</option>
        `;
    if (player.relationshipStatus) statusSelect.value = player.relationshipStatus;
    relGroup.append(relLabel, statusSelect);
    const relWrap = el('div', 'field-group-wrap');
    relWrap.appendChild(relGroup);

    // Partner select (conditional — grouped with status)
    partnerGroup = el('div', 'form-group');
    partnerGroup.style.display = 'none';
    const partnerLabel = el<HTMLLabelElement>('label', 'form-label');
    partnerLabel.htmlFor = 'edit-partner';
    partnerLabel.textContent = 'Parceiro/a no jogo';
    partnerSelect = el<HTMLSelectElement>('select', 'form-select');
    partnerSelect.id = 'edit-partner';
    partnerGroup.append(partnerLabel, partnerSelect);
    relWrap.appendChild(partnerGroup);
    form.appendChild(relWrap);

    // Open to outside (highlighted container — includes target sex when toggled)
    openWrap = el('div', 'toggle-wrap toggle-wrap--open');
    openWrap.style.display = 'none';
    const openRow = el('div', 'toggle-wrap__row');
    const openLabelDiv = el('div', 'toggle-label');
    openLabelDiv.innerHTML =
      '<div class="toggle-label__title">Aberto/a a interações externas</div>' +
      '<div class="toggle-label__desc">Pode participar em desafios com qualquer outro jogador</div>';
    openLiquidToggle = buildLiquidToggle('edit-player-open', openChecked);
    openLiquidToggle.addEventListener('click', () => {
      openChecked = !openChecked;
      openLiquidToggle!.setAttribute('aria-checked', String(openChecked));
      animateLiquidToggle(openLiquidToggle!, openChecked);
      updateConditionalFields();
    });
    openRow.append(openLabelDiv, openLiquidToggle);

    // Target sex (inside openWrap, shown only when toggle is on)
    targetSexGroup = buildRadioGroup<TargetSex>('edit-targetsex', 'Sexo alvo para interações', [
      { value: 'male', label: '♂ Masculino' },
      { value: 'female', label: '♀ Feminino' },
      { value: 'both', label: '⚥ Ambos' },
    ]);
    for (const inp of Array.from(targetSexGroup.querySelectorAll<HTMLInputElement>('input'))) {
      inp.defaultChecked = false;
      inp.checked = inp.value === (player.targetSex ?? 'both');
      if (inp.checked) inp.defaultChecked = true;
    }
    targetSexGroup.style.display = 'none';
    openWrap.append(openRow, targetSexGroup);
    form.appendChild(openWrap);

    statusSelect.addEventListener('change', updateConditionalFields);
    updateConditionalFields();

    // Restore pre-selected partner after populate
    if (partnerSelect && player.partnerId) {
      partnerSelect.value = player.partnerId;
    }
  }

  body.appendChild(form);

  // ── Action buttons ────────────────────────────────────────
  const editActions = el('div', 'edit-modal-actions');
  const saveBtn = el<HTMLButtonElement>('button', 'btn btn--primary btn--full');
  saveBtn.type = 'button';
  saveBtn.textContent = '✓  Guardar alterações';
  const cancelBtn = el<HTMLButtonElement>('button', 'btn btn--ghost btn--full');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', forceClose);
  editActions.append(saveBtn, cancelBtn);
  body.appendChild(editActions);

  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    let sexChecked: Sex | null = null;
    if (sexInputs?.m.checked) sexChecked = 'male';
    else if (sexInputs?.f.checked) sexChecked = 'female';

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

    if (tier === 2) {
      const isCoupled = tier2CoupleRadio?.checked ?? false;
      extras.partnerId = isCoupled ? tier2PartnerSelect?.value || null : null;
    }

    if (tier >= 3) {
      const orientation = getCheckedValue<Orientation>(
        orientationInputs ?? emptyNodeList<HTMLInputElement>(),
      );
      if (orientation !== undefined) extras.orientation = orientation;
      extras.relationshipStatus = (statusSelect?.value as RelationshipStatus) ?? 'single';
      extras.partnerId = partnerSelect?.value || null;
      extras.openToOutside = openChecked && extras.relationshipStatus !== 'closed';
      if (extras.openToOutside) {
        extras.targetSex =
          getCheckedValue<TargetSex>(
            targetSexGroup?.querySelectorAll('input') ?? emptyNodeList<HTMLInputElement>(),
          ) ?? 'both';
      }
    }

    const updated: Player = { ...player, name, ...extras };
    store.update(Actions.updatePlayer(updated));
    forceClose();
  });

  content.append(header, body);

  panel.innerHTML = `
        <div class="glass-effect" aria-hidden="true"></div>
        <div class="glass-tint" aria-hidden="true"></div>
        <div class="glass-shine" aria-hidden="true"></div>
    `;
  panel.appendChild(content);
  modal.append(backdrop, panel);
  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.removeAttribute('inert');
    modal.classList.add('visible');
    requestAnimationFrame(() => nameInput.focus());
  });

  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', handleKeyDown);
}

// ─── Penalties toggle ─────────────────────────────────────────────────────────

function buildPenaltyToggle(store: GameStore): HTMLElement {
  const wrap = el('div', 'toggle-wrap toggle-wrap--penalty');

  const labelDiv = el('div', 'toggle-label');
  labelDiv.innerHTML =
    '<div class="toggle-label__title">🍺 Ativar penalizações</div>' +
    '<div class="toggle-label__desc">Quem recusar tem de beber os shots indicados na carta</div>';

  let penaltyChecked = store.state.penaltiesEnabled;
  const toggleBtn = buildLiquidToggle('penalties-toggle', penaltyChecked);
  toggleBtn.addEventListener('click', () => {
    penaltyChecked = !penaltyChecked;
    toggleBtn.setAttribute('aria-checked', String(penaltyChecked));
    animateLiquidToggle(toggleBtn, penaltyChecked);
    store.update(Actions.setPenalties(penaltyChecked));
  });

  wrap.append(labelDiv, toggleBtn);
  return wrap;
}

// ─── Start button ─────────────────────────────────────────────────────────────

function buildStartButton(store: GameStore): HTMLElement {
  const section = el('div', 'stack stack--3');
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

function targetSexLabel(t: TargetSex): string {
  if (t === 'male') return '♂ masc.';
  if (t === 'female') return '♀ fem.';
  return '⚥ ambos';
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
