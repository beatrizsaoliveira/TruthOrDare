/**
 * Glass-styled confirm modal — replaces native window.confirm().
 * Returns a Promise that resolves to true (confirmed) or false (cancelled).
 */

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** If true, the confirm button uses a danger/pill style */
  danger?: boolean;
};

export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
  } = options;

  return new Promise((resolve) => {
    let settled = false;

    // ── Build DOM ────────────────────────────────────────────
    const modal = document.createElement('div');
    modal.className = 'help-modal confirm-modal';
    modal.setAttribute('inert', '');

    const backdrop = document.createElement('div');
    backdrop.className = 'help-modal-backdrop';

    const panel = document.createElement('div');
    panel.className = 'help-modal-panel confirm-modal-panel';

    const content = document.createElement('div');
    content.className = 'help-modal-content';
    content.style.cssText = 'padding:20px;gap:16px;';

    const header = document.createElement('div');
    header.className = 'help-modal-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'help-modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const body = document.createElement('div');
    body.style.cssText =
      'font-size:0.925rem;line-height:1.55;color:var(--clr-text-muted);padding:0 4px;';
    body.textContent = message;

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;padding-top:4px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn--ghost';
    cancelBtn.textContent = cancelLabel;
    cancelBtn.setAttribute('aria-label', cancelLabel);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = danger ? 'btn btn--danger' : 'btn btn--primary';
    confirmBtn.textContent = confirmLabel;
    confirmBtn.setAttribute('aria-label', confirmLabel);

    actions.append(cancelBtn, confirmBtn);
    content.append(header, body, actions);

    panel.innerHTML = `
      <div class="glass-effect" aria-hidden="true"></div>
      <div class="glass-tint" aria-hidden="true"></div>
      <div class="glass-shine" aria-hidden="true"></div>
    `;
    panel.appendChild(content);
    modal.append(backdrop, panel);
    document.body.appendChild(modal);

    // ── Cleanup ──────────────────────────────────────────────
    function cleanup(value: boolean): void {
      if (settled) return;
      settled = true;
      modal.classList.remove('visible');
      modal.addEventListener(
        'transitionend',
        () => {
          modal.remove();
          resolve(value);
        },
        { once: true },
      );
      // Fallback: remove after timeout if transitionend doesn't fire
      setTimeout(() => {
        if (modal.parentNode) {
          modal.remove();
          resolve(value);
        }
      }, 300);
    }

    // ── Events ───────────────────────────────────────────────
    backdrop.addEventListener('click', () => cleanup(false));
    cancelBtn.addEventListener('click', () => cleanup(false));
    confirmBtn.addEventListener('click', () => cleanup(true));

    // Close on Escape
    function onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        cleanup(false);
        document.removeEventListener('keydown', onKeydown);
      }
    }
    document.addEventListener('keydown', onKeydown);

    // ── Open ─────────────────────────────────────────────────
    // Force layout before adding visible class for transition
    void modal.offsetWidth;
    modal.removeAttribute('inert');
    modal.classList.add('visible');
    requestAnimationFrame(() => confirmBtn.focus());
  });
}
