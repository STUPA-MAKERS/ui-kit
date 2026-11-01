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
 * - `color` (a configured hex colour, for example of a flow state) is a status too. It
 *   draws text in that colour, made darker in the light theme and lighter in the dark
 *   theme until it has AA contrast (4.5:1) on every surface a status sits on.
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
   * A configured colour (hex, for example of a flow state). When it is set, it replaces
   * the variant: the badge shows a status as text in this colour, see {@link statusText}.
   */
  @Input() color?: string | null;

  /** The text colour of {@link color} for each theme, or null for no or an invalid colour. */
  get statusText(): StatusTextColors | null {
    return statusTextColors(this.color);
  }
}

/** The text colour of a configured status colour in the light and in the dark theme. */
export interface StatusTextColors {
  light: string;
  dark: string;
}

/**
 * The surfaces a status text sits on, per theme: page, box, field and selected row
 * (`--c-<theme>-bg`, `-c1`, `-c2`, `-c3`, `-sel` in `tokens.scss`; the badge spec checks
 * that the values agree).
 */
export const STATUS_SURFACES = {
  light: ['#f6f7f5', '#ffffff', '#f0f2ef', '#e6e9e5', '#e1eee5'],
  dark: ['#101211', '#171a18', '#1d201e', '#262a27', '#243129'],
} as const;

/** The WCAG AA contrast for normal text. */
const AA_TEXT = 4.5;

/**
 * Makes a configured status colour readable as text in both themes. The colour keeps its
 * hue: for the light theme it moves towards black, for the dark theme towards white, in
 * 5% steps, until its contrast against each surface of {@link STATUS_SURFACES} is at
 * least 4.5:1. A colour that already has the contrast stays as it is.
 * Returns null for a missing or an invalid hex colour.
 */
export function statusTextColors(hex?: string | null): StatusTextColors | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  return {
    light: toHex(readableOn(rgb, [0, 0, 0], STATUS_SURFACES.light)),
    dark: toHex(readableOn(rgb, [255, 255, 255], STATUS_SURFACES.dark)),
  };
}

type Rgb = [number, number, number];

function readableOn(rgb: Rgb, towards: Rgb, surfaces: readonly string[]): Rgb {
  const backs = surfaces.map((s) => parseHex(s) as Rgb);
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const c = rgb.map((v, i) => Math.round(v + (towards[i] - v) * t)) as Rgb;
    if (backs.every((b) => contrast(c, b) >= AA_TEXT)) return c;
  }
  return towards;
}

function parseHex(hex?: string | null): Rgb | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** The WCAG 2.1 relative luminance of an sRGB colour. */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG 2.1 contrast ratio of two colours. */
function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

