import type { Player, Sex } from '../types/index.js';

/**
 * Resolves a `word/a` gender-agreement token in European Portuguese.
 *
 * Convention used in the dataset:
 *   masculine_form/a   →   e.g. sozinho/a, apanhado/a, nu/a, vendado/a
 *
 * Rule:
 *   - Female: if the masculine form ends in 'o', replace the last 'o' with 'a';
 *             otherwise append 'a' (e.g. nu → nua).
 *   - Male:   return the masculine form unchanged.
 */
function resolveGenderToken(masculineForm: string, sex: Sex): string {
  if (sex === 'male') return masculineForm;
  if (masculineForm.endsWith('o')) {
    return masculineForm.slice(0, -1) + 'a';
  }
  return masculineForm + 'a';
}

/**
 * Processes raw card text for display:
 *
 *  1. Replaces `[Target Player]` with the target player's name (if provided).
 *  2. Resolves `word/a` gender tokens based on the active player's sex.
 *     When the active player's sex is unknown (Tier 1), the text is left
 *     in the ambiguous form so both genders are visible.
 *
 * @param rawText       - The original card text from the Markdown file.
 * @param activePlayer  - The player whose turn it is.
 * @param targetPlayer  - The target player for this card (optional).
 */
export function formatCardText(
  rawText: string,
  activePlayer: Player,
  targetPlayer?: Player,
): string {
  let text = rawText;

  // ── 1. Replace target player placeholder ────────────────────────────────────
  if (targetPlayer) {
    text = text.replaceAll('[Target Player]', `<strong>${escapeHtml(targetPlayer.name)}</strong>`);
  }

  // ── 2. Resolve gender tokens ─────────────────────────────────────────────────
  if (activePlayer.sex) {
    const sex = activePlayer.sex;
    // Matches patterns like "sozinho/a", "apanhado/a", "nu/a"
    // Capture group 1: masculine form (word chars before the slash)
    text = text.replace(/(\w+)\/[ao]\b/g, (_match, masculine: string) => {
      return resolveGenderToken(masculine, sex);
    });
  }

  return text;
}

/** Minimal HTML entity escaping to prevent XSS when inserting player names. */
function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;');
}

/**
 * Returns the Portuguese label for a sex value.
 * Used in the UI to display player profiles.
 */
export function sexLabel(sex: Sex): string {
  return sex === 'male' ? 'Masculino' : 'Feminino';
}

/**
 * Returns the Portuguese label for an orientation value.
 */
export function orientationLabel(o: Player['orientation']): string {
  switch (o) {
    case 'hetero':
      return 'Heterossexual';
    case 'homo':
      return 'Homossexual';
    case 'bi':
      return 'Bissexual';
    default:
      return '—';
  }
}

/**
 * Returns the Portuguese label for a relationship status.
 */
export function relationshipLabel(r: Player['relationshipStatus']): string {
  switch (r) {
    case 'single':
      return 'Solteiro/a';
    case 'open':
      return 'Relação Aberta';
    case 'closed':
      return 'Relação Exclusiva';
    default:
      return '—';
  }
}
