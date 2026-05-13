import type { Player, Sex } from '../types/index.js';

/**
 * Processes raw card text for display:
 *
 *  1. Replaces `[Target Player]` with the target player's name (if provided).
 *
 * Gender is expressed directly in the text using the (a) convention,
 * e.g. "nu(a)", "sozinho(a)". No dynamic adaptation is performed.
 *
 * @param rawText       - The original card text from the dataset.
 * @param activePlayer  - The player whose turn it is.
 * @param targetPlayer  - The target player for this card (optional).
 */
export function formatCardText(
    rawText: string,
    activePlayer: Player,
    targetPlayer?: Player
): string {
    let text = rawText;

    // Replace target player placeholder
    if (targetPlayer) {
        text = text.replaceAll(
            '[Target Player]',
            `<strong>${escapeHtml(targetPlayer.name)}</strong>`
        );
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
