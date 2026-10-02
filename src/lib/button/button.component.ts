import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';

/**
 * The looks of a button.
 *
 * - `fill`: the main action, accent surface. One per view.
 * - `tonal`: a secondary action on a grey surface.
 * - `outlined`: a secondary action with an edge and no surface.
 * - `text`: a quiet action, accent text only. As an icon button: a grey glyph.
 * - `danger`: a destructive action, outlined in the error colour.
 * - `fab`: the floating main action of a page.
 */
export type ButtonLook = 'fill' | 'tonal' | 'outlined' | 'text' | 'danger' | 'fab';

/**
 * A look, or one of the older names that callers still use. The older names are aliases:
 * `primary` and `success` are `fill`, `secondary` is `tonal`, `ghost` is `text` and
 * `danger-outline` is `danger`.
 */
export type ButtonVariant =
  | ButtonLook
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger-outline'
  | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

const LOOK: Record<ButtonVariant, ButtonLook> = {
  fill: 'fill',
  tonal: 'tonal',
  outlined: 'outlined',
  text: 'text',
  danger: 'danger',
  fab: 'fab',
  primary: 'fill',
  success: 'fill',
  secondary: 'tonal',
  ghost: 'text',
  'danger-outline': 'danger',
};

/** The look of a variant name. An unknown name falls back to `fill`. */
export function buttonLook(variant: ButtonVariant): ButtonLook {
  return LOOK[variant] ?? 'fill';
}

/**
 * Base button of the UI kit: pill shape, three sizes (32/40/52px), design tokens and a
 * visible focus ring. With `iconOnly` it is a round icon button.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  /** Frei wählbare Hintergrundfarbe (Hex); überschreibt die Variante. */
  @Input() color: string | null = null;
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  /** Quadratischer Icon-Button (gleiche Höhe/Breite) für einzelne Glyphs (✕ ↑ ↓). */
  @Input() iconOnly = false;
  /** Volle Breite des Containers (gestapelte Aktionen gleicher Breite). */
  @Input() @HostBinding('class.btn-block') block = false;
  /** Barrierefreier Name — Pflicht für Icon-Buttons ohne sichtbaren Text. */
  @Input() ariaLabel = '';
  /**
   * Toggle-Zustand für einen Button, der an/aus ist — etwa ein Segment in einer
   * Filtergruppe. Ohne das unterscheidet nur die `variant`-Farbe den aktiven Eintrag,
   * und eine Vorlesehilfe hört drei gleich benannte Buttons ohne Zustand.
   */
  @Input() ariaPressed: boolean | null = null;
  /** Hover-Tooltip; bei Icon-Buttons fällt er automatisch auf `ariaLabel` zurück. */
  @Input() title = '';

  /** CSS classes of the native button: the look, the variant name and the size. */
  protected classes(): string {
    const look = buttonLook(this.variant);
    const names = look === this.variant ? `btn--${look}` : `btn--${look} btn--${this.variant}`;
    return `btn ${names} btn--${this.size}${this.iconOnly ? ' btn--icon' : ''}`;
  }

  /** Tooltip-Text: explizit gesetzt, sonst für Icon-Buttons der `ariaLabel`. */
  protected tooltip(): string | null {
    return this.title || (this.iconOnly ? this.ariaLabel : '') || null;
  }

  /** Lesbare Textfarbe (schwarz/weiß) zur gewählten `color` per WCAG-Luminanz. */
  protected contrastColor(): string {
    const hex = (this.color ?? '').trim().replace('#', '');
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    if (full.length !== 6) return '#ffffff';
    const channel = (i: number) => {
      const v = parseInt(full.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const lum = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
    return lum > 0.4 ? '#111111' : '#ffffff';
  }
}
