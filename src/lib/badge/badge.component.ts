import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/**
 * A short label beside a name.
 *
 * - `neutral` and `accent` are tags: a feature of the thing, not its status (NÖ,
 *   Stimmrecht, Pool, Pflichtrolle). They draw a small grey (or accent) plate.
 * - `primary`, `success`, `warning`, `danger` and `info` are a STATUS. The design system
 *   shows a status as text in its colour, without a plate, a dot or a pill.
 * - `color` (a configured hex colour, for example of a flow state) draws a plate in that
 *   colour with readable text.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';

  /** True for the variants that show a status as coloured text. */
  get isStatus(): boolean {
    return this.variant !== 'neutral' && this.variant !== 'accent';
  }

  /**
   * Optionale, frei konfigurierte Hintergrundfarbe (Hex, z. B. Flow-State-Farbe).
   * Ist sie gesetzt, überschreibt sie das Variant-Styling; die Textfarbe wird
   * automatisch lesbar gewählt (dunkler Text auf hellem Grund, sonst weiß).
   */
  @Input() color?: string | null;

  /** Lesbare Textfarbe für {@link color} via Luminanz-Schwelle. */
  get textColor(): string {
    return readableTextColor(this.color) ?? '#ffffff';
  }
}

/**
 * Liefert `#1a1a1a` (dunkel) oder `#ffffff` (weiß) je nach wahrgenommener
 * Helligkeit der gegebenen Hex-Farbe. Gibt `null` bei ungültiger Eingabe.
 */
export function readableTextColor(hex?: string | null): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative Luminanz (sRGB, schnelle Variante).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}
