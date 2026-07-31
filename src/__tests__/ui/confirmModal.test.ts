import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showConfirm } from '../../ui/confirmModal';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function advanceFallback(): void {
  // The modal removes itself via a 300ms setTimeout fallback when no
  // transitionend event fires (jsdom never fires transitions).
  vi.advanceTimersByTime(300);
}

describe('showConfirm', () => {
  it('creates a glass modal with confirm and cancel buttons', () => {
    showConfirm({ title: 'Título', message: 'Mensagem' });

    const modal = document.querySelector('.confirm-modal');
    expect(modal).not.toBeNull();
    expect(modal!.classList.contains('help-modal')).toBe(true);

    const confirmBtn = document.querySelector('.btn--primary');
    const cancelBtn = document.querySelector('.btn--ghost');
    expect(confirmBtn).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
  });

  it('uses the danger style on the confirm button when danger=true', () => {
    showConfirm({ title: 'T', message: 'M', danger: true });
    expect(document.querySelector('.btn--danger')).not.toBeNull();
    expect(document.querySelector('.btn--primary')).toBeNull();
  });

  it('resolves true when the confirm button is clicked', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    const confirmBtn = document.querySelector('.confirm-modal .btn--primary') as HTMLButtonElement;
    confirmBtn.click();

    advanceFallback();
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when the cancel button is clicked', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    const cancelBtn = document.querySelector('.confirm-modal .btn--ghost') as HTMLButtonElement;
    cancelBtn.click();

    advanceFallback();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when the backdrop is clicked', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    const backdrop = document.querySelector('.help-modal-backdrop') as HTMLElement;
    backdrop.click();

    advanceFallback();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when the Escape key is pressed', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    advanceFallback();
    await expect(promise).resolves.toBe(false);
  });

  it('does not resolve before any interaction', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    const cancelBtn = document.querySelector('.confirm-modal .btn--ghost') as HTMLButtonElement;
    expect(cancelBtn).not.toBeNull();

    let settled = false;
    promise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it('removes the modal from the DOM after resolving', async () => {
    vi.useFakeTimers();
    const promise = showConfirm({ title: 'T', message: 'M' });

    const confirmBtn = document.querySelector('.confirm-modal .btn--primary') as HTMLButtonElement;
    confirmBtn.click();

    advanceFallback();
    await promise;
    expect(document.querySelector('.confirm-modal')).toBeNull();
  });
});
