import { Injectable, computed, inject, signal } from '@angular/core';
import { withViewTransition } from '../motion/motion';
import { UI_KIT_THEME, type ResolvedTheme, type ThemePreference } from './theme.config';

/**
 * Theme control:
 * - The preference is `system` (follows the OS), `light` or `dark`. It is persisted under
 *   the `storageKey` of {@link UI_KIT_THEME}.
 * - The service writes the effective theme to `data-theme` on `<html>`, which the tokens of
 *   the kit read, writes its page background to every `<meta name="theme-color">`, and
 *   links the manifest of that theme.
 * - In `system` mode a matchMedia listener picks up an OS change live.
 *
 * Configure it with `provideUiKit({ theme: { storageKey, manifest, background } })`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly config = inject(UI_KIT_THEME);
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly _preference = signal<ThemePreference>(this.readStored());
  private readonly _systemDark = signal<boolean>(this.media.matches);
  /** The theme of a page that sets its own default (for example a projector view), or `null`. */
  private readonly _pageDefault = signal<ResolvedTheme | null>(null);

  readonly preference = this._preference.asReadonly();

  /** The theme that is in effect (`light` or `dark`). */
  readonly resolved = computed<ResolvedTheme>(() => {
    const pref = this._preference();
    if (pref === 'system') return this._pageDefault() ?? (this._systemDark() ? 'dark' : 'light');
    return pref;
  });

  /** Call this once at app start. It adds the OS listener and applies the theme. */
  init(): void {
    this.media.addEventListener('change', this.onSystemChange);
    this.apply();
  }

  /** The whole page cross-fades once instead of each surface changing on its own. */
  setPreference(pref: ThemePreference): void {
    this._preference.set(pref);
    this.persist(pref);
    withViewTransition(() => this.apply());
  }

  /**
   * Set the theme that `system` gives while one page shows, for example dark for a
   * projector view. An explicit choice of the person (`light` or `dark`) still wins. The
   * page calls it again with `null` when it goes, and the OS theme applies again. The
   * service does not persist this value.
   */
  setPageDefault(theme: ResolvedTheme | null): void {
    this._pageDefault.set(theme);
    this.apply();
  }

  /** Switch between light and dark, based on the theme that is visible now. */
  toggle(): void {
    this.setPreference(this.resolved() === 'dark' ? 'light' : 'dark');
  }

  private readonly onSystemChange = (e: MediaQueryListEvent): void => {
    this._systemDark.set(e.matches);
    if (this._preference() === 'system') this.apply();
  };

  /**
   * `index.html` carries one theme-color tag per OS scheme. An explicit choice in the app
   * overrides the OS, so both tags take the colour of the theme in effect.
   */
  private apply(): void {
    const theme = this.resolved();
    document.documentElement.setAttribute('data-theme', theme);
    const background = this.config.background[theme];
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute('content', background));
    const manifest = this.config.manifest;
    if (manifest) {
      document
        .querySelector<HTMLLinkElement>('link[rel="manifest"]')
        ?.setAttribute('href', manifest[theme]);
    }
  }

  private readStored(): ThemePreference {
    try {
      const v = localStorage.getItem(this.config.storageKey);
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch {
      /* storage blocked: the default applies */
    }
    return 'system';
  }

  private persist(pref: ThemePreference): void {
    try {
      localStorage.setItem(this.config.storageKey, pref);
    } catch {
      /* storage blocked or full: the choice holds for this session only */
    }
  }
}
