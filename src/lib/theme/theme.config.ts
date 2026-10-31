import { InjectionToken } from '@angular/core';

/** The theme a person can choose: `system` follows the OS. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** The theme in effect. */
export type ResolvedTheme = 'light' | 'dark';

/** The settings of the {@link ThemeService} that differ per app. */
export interface UiKitThemeConfig {
  /** The `localStorage` key of the preference. Give each app its own key. */
  readonly storageKey: string;
  /**
   * The manifest URL per theme. An installed Android app paints its navigation bar with
   * `theme_color` or `background_color` of the manifest, and a manifest has no per-scheme
   * variant, so the service links the dark manifest while the dark theme is in effect.
   * `null` leaves the `<link rel="manifest">` as it is.
   */
  readonly manifest: Readonly<Record<ResolvedTheme, string>> | null;
  /**
   * The page background per theme, for every `<meta name="theme-color">`, so the browser
   * bars and the bars of the installed app follow the theme. Keep it in step with
   * `--color-bg` of the tokens and with the tags in `index.html`.
   */
  readonly background: Readonly<Record<ResolvedTheme, string>>;
}

/** Options of `provideUiKit({ theme })`: every field is optional and falls back to the default. */
export type UiKitThemeOptions = Partial<UiKitThemeConfig>;

/** The defaults: the background of the kit tokens and a manifest with a `scheme` query. */
export const UI_KIT_THEME_DEFAULTS: UiKitThemeConfig = {
  storageKey: 'ui-kit.theme',
  manifest: {
    light: 'manifest.webmanifest',
    dark: 'manifest.webmanifest?scheme=dark',
  },
  background: {
    light: '#f6f7f5',
    dark: '#101211',
  },
};

/** DI token of the theme settings. `provideUiKit({ theme })` sets it. */
export const UI_KIT_THEME = new InjectionToken<UiKitThemeConfig>('UI_KIT_THEME', {
  providedIn: 'root',
  factory: () => UI_KIT_THEME_DEFAULTS,
});

/** The defaults with the given options on top. */
export function uiKitThemeConfig(options: UiKitThemeOptions = {}): UiKitThemeConfig {
  return {
    storageKey: options.storageKey ?? UI_KIT_THEME_DEFAULTS.storageKey,
    manifest: options.manifest === undefined ? UI_KIT_THEME_DEFAULTS.manifest : options.manifest,
    background: options.background ?? UI_KIT_THEME_DEFAULTS.background,
  };
}
