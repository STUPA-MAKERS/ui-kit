import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// a11y matcher (WCAG 2.1 AA) available in every spec.
expect.extend(toHaveNoViolations);

// jsdom reports `en-US`; the kit's reference locale is German. Pin it so the built-in
// DefaultUiKitIntl and locale-dependent components (datepicker/currency) are deterministic.
// Individual specs flip the language via the injected UI_KIT_INTL instance.
Object.defineProperty(navigator, 'language', { value: 'de-DE', configurable: true });

// matchMedia is not implemented in jsdom.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
