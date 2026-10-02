/**
 * Layout breakpoints for TypeScript code (`matchMedia`, `BreakpointObserver`). The values
 * are the same as in `src/styles/_breakpoints.scss`. Change both files together.
 *
 * - phone: width <= 768px (bottom bar, stacked cards, near-fullscreen dialogs)
 * - narrow: 769px to 1199px (navigation rail, list and detail as separate views)
 * - wide: width >= 1200px (navigation rail, list and detail side by side)
 */
export const BREAKPOINTS = {
  /** The widest viewport that counts as a phone, in px. */
  phoneMax: 768,
  /** The narrowest viewport that shows a list and its detail side by side, in px. */
  wideMin: 1200,
} as const;

/** Media queries for the three width classes. */
export const MEDIA = {
  phone: '(max-width: 768px)',
  narrow: '(min-width: 768.02px) and (max-width: 1199.98px)',
  wide: '(min-width: 1200px)',
  notPhone: '(min-width: 768.02px)',
  belowWide: '(max-width: 1199.98px)',
} as const;

export type WidthClass = 'phone' | 'narrow' | 'wide';

/** Width class of a viewport width in CSS px. */
export function widthClass(width: number): WidthClass {
  if (width <= BREAKPOINTS.phoneMax) return 'phone';
  if (width < BREAKPOINTS.wideMin) return 'narrow';
  return 'wide';
}
