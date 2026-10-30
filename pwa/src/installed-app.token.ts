import { InjectionToken } from '@angular/core';

/** The parts of `window` that tell an installed app from a browser tab. */
export interface DisplayModeHost {
  matchMedia?: (query: string) => { matches: boolean };
  navigator: { standalone?: boolean };
}

/**
 * The display modes of an installed web app. The manifest asks for `standalone`, but a
 * browser can fall back to `minimal-ui`, and a person can start the app in `fullscreen`.
 * A browser tab always reports `browser`.
 */
const INSTALLED_DISPLAY_MODES = ['standalone', 'fullscreen', 'minimal-ui'] as const;

/**
 * Tells if the page runs as the installed app (PWA) and not in a browser tab.
 *
 * iOS Safari does not report the display mode of an app on the home screen, so the
 * function also reads the non-standard `navigator.standalone`.
 */
export function isInstalledApp(host: DisplayModeHost): boolean {
  if (host.navigator.standalone === true) return true;
  const match = host.matchMedia;
  if (typeof match !== 'function') return false;
  return INSTALLED_DISPLAY_MODES.some(
    (mode) => match.call(host, `(display-mode: ${mode})`).matches,
  );
}

/**
 * DI handle that tells if the page runs as the installed app.
 *
 * The token is a function, so the value is read at the time of use and not at the start
 * of the app: a login that asks the server for the longer session of the installed app
 * reads it when the person signs in. A spec overrides the token with a provider.
 */
export const IS_INSTALLED_APP = new InjectionToken<() => boolean>('IS_INSTALLED_APP', {
  providedIn: 'root',
  factory: () => () => isInstalledApp(window as unknown as DisplayModeHost),
});
