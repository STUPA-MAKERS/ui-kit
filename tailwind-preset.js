/**
 * Tailwind preset for @stupa-makers/ui-kit.
 *
 * The kit's component templates use utility classes whose values are aliases of the
 * design-system CSS custom properties (from `@stupa-makers/ui-kit/styles`). A consuming
 * project gets the same look by extending this preset and adding the kit to `content`:
 *
 *   const uiKit = require('@stupa-makers/ui-kit/tailwind-preset');
 *   module.exports = {
 *     presets: [uiKit],
 *     content: [
 *       './src/**\/*.{html,ts}',
 *       './node_modules/@stupa-makers/ui-kit/**\/*.mjs', // scan the kit's compiled templates
 *     ],
 *   };
 *
 * Preflight is disabled (additive utilities only — the base reset ships via the styles
 * entry, not Tailwind). The theme is REPLACED (not extended) so only token values exist.
 *
 * @type {import('tailwindcss').Config}
 */
const sp = (n) => `var(--space-${n})`;

module.exports = {
  content: [],
  corePlugins: {
    preflight: false,
  },
  theme: {
    spacing: {
      0: '0',
      px: '1px',
      1: sp(1),
      2: sp(2),
      3: sp(3),
      4: sp(4),
      5: sp(5),
      6: sp(6),
      7: sp(7),
      8: sp(8),
      10: sp(10),
      12: sp(12),
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      DEFAULT: 'var(--radius-md)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      pill: 'var(--radius-pill)',
      full: 'var(--radius-pill)',
    },
    borderWidth: {
      DEFAULT: 'var(--border-width)',
      0: '0',
      2: '2px',
    },
    fontSize: {
      xs: 'var(--fs-xs)',
      sm: 'var(--fs-sm)',
      base: 'var(--fs-md)',
      md: 'var(--fs-md)',
      lg: 'var(--fs-lg)',
      xl: 'var(--fs-xl)',
      '2xl': 'var(--fs-2xl)',
      '3xl': 'var(--fs-3xl)',
    },
    fontWeight: {
      normal: 'var(--fw-regular)',
      regular: 'var(--fw-regular)',
      medium: 'var(--fw-medium)',
      semibold: 'var(--fw-semibold)',
      bold: 'var(--fw-bold)',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      DEFAULT: 'var(--shadow-md)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
    zIndex: {
      auto: 'auto',
      0: '0',
      dropdown: 'var(--z-dropdown)',
      sticky: 'var(--z-sticky)',
      dialog: 'var(--z-dialog)',
      toast: 'var(--z-toast)',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      bg: 'var(--color-bg)',
      'bg-elevated': 'var(--color-bg-elevated)',
      surface: 'var(--color-surface)',
      'surface-sunken': 'var(--color-surface-sunken)',
      line: 'var(--color-border)',
      'line-strong': 'var(--color-border-strong)',
      text: 'var(--color-text)',
      muted: 'var(--color-text-muted)',
      inverse: 'var(--color-text-inverse)',
      primary: 'var(--color-primary)',
      'primary-hover': 'var(--color-primary-hover)',
      'primary-active': 'var(--color-primary-active)',
      'primary-subtle': 'var(--color-primary-subtle)',
      'on-primary': 'var(--color-on-primary)',
      accent: 'var(--color-accent)',
      success: 'var(--color-success)',
      'success-subtle': 'var(--color-success-subtle)',
      warning: 'var(--color-warning)',
      'warning-subtle': 'var(--color-warning-subtle)',
      danger: 'var(--color-danger)',
      'danger-subtle': 'var(--color-danger-subtle)',
      info: 'var(--color-info)',
      'info-subtle': 'var(--color-info-subtle)',
    },
    extend: {
      fontFamily: {
        mono: 'var(--font-mono, monospace)',
      },
    },
  },
  plugins: [],
};
