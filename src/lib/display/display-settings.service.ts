import { Injectable, computed, inject, signal } from '@angular/core';
import { UI_KIT_THEME } from '../theme/theme.config';

/**
 * A display setting that a person can set for this device:
 * - `contrast`: more contrast for text, edges and the focus ring (system: `prefers-contrast`).
 * - `motion`: less motion (system: `prefers-reduced-motion`).
 * - `transparency`: opaque surfaces instead of glass (system: `prefers-reduced-transparency`).
 * - `fields`: input fields black on yellow. No system setting asks for it, so it is off
 *   until the person turns it on.
 */
export type DisplaySetting = 'contrast' | 'motion' | 'transparency' | 'fields';

/** The choices of a person. A setting that is missing follows the system. */
export type DisplayChoices = Partial<Record<DisplaySetting, boolean>>;

/** The system query of each setting, or `null` where the system has none. */
export const DISPLAY_MEDIA: Readonly<Record<DisplaySetting, string | null>> = {
  contrast: '(prefers-contrast: more)',
  motion: '(prefers-reduced-motion: reduce)',
  transparency: '(prefers-reduced-transparency: reduce)',
  fields: null,
};

/** The attribute on `<html>` and its value for on and for off, which the styles read. */
export const DISPLAY_ATTRIBUTES: Readonly<Record<DisplaySetting, readonly [string, string, string]>> = {
  contrast: ['data-contrast', 'more', 'normal'],
  motion: ['data-motion', 'reduce', 'full'],
  transparency: ['data-transparency', 'reduce', 'full'],
  fields: ['data-fields', 'highlight', 'normal'],
};

const SETTINGS = Object.keys(DISPLAY_MEDIA) as readonly DisplaySetting[];

/** The attribute that draws the glass again after a change (see `renewGlass`). */
export const GLASS_RENEW = 'data-glass-renew';

function matchList(query: string | null): MediaQueryList | null {
  if (query === null || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(query);
}

/**
 * The display settings of this device (app spec 000594). Each setting follows the system
 * until the person sets it. A choice overrides the system in this browser only and is
 * kept in `localStorage` under the theme key with the suffix `.display`, never in the
 * account.
 *
 * The service writes the setting in effect to an attribute on `<html>` (see
 * {@link DISPLAY_ATTRIBUTES}), always with a value, so the styles and
 * {@link reducedMotion} need no media query of their own. A change of the system setting
 * applies live while the person has no choice.
 */
@Injectable({ providedIn: 'root' })
export class DisplaySettingsService {
  private readonly key = `${inject(UI_KIT_THEME).storageKey}.display`;
  private readonly _choices = signal<DisplayChoices>(this.readStored());
  private readonly _system = signal<Record<DisplaySetting, boolean>>(this.readSystem());

  /** The choices of the person: a missing setting follows the system. */
  readonly choices = this._choices.asReadonly();

  /** The person has set at least one setting. */
  readonly hasChoice = computed(() => Object.keys(this._choices()).length > 0);

  /** The state in effect of each setting. */
  readonly effective = computed<Record<DisplaySetting, boolean>>(() => {
    const choices = this._choices();
    const system = this._system();
    return Object.fromEntries(SETTINGS.map((s) => [s, choices[s] ?? system[s]])) as Record<
      DisplaySetting,
      boolean
    >;
  });

  /** Call this once at app start. It adds the system listeners and writes the attributes. */
  init(): void {
    SETTINGS.forEach((setting) =>
      matchList(DISPLAY_MEDIA[setting])?.addEventListener('change', (event) => {
        this._system.update((system) => ({ ...system, [setting]: event.matches }));
        this.apply();
      }),
    );
    this.apply();
  }

  /** Set one setting for this device; it overrides the system. */
  set(setting: DisplaySetting, on: boolean): void {
    this._choices.update((choices) => ({ ...choices, [setting]: on }));
    this.persist();
    this.apply();
    this.renewGlass();
  }

  /** Remove every choice: each setting follows the system again. */
  reset(): void {
    this._choices.set({});
    this.persist();
    this.apply();
    this.renewGlass();
  }

  /**
   * Draws every glass surface again after a change of a setting. A browser can lose the
   * backdrop filter of the glass that is already on screen when the attributes on `<html>`
   * change, and draws it again only after a reload or a change of the tab. The attribute
   * `data-glass-renew` removes every backdrop filter for two frames (`display-settings.scss`),
   * so the browser builds the glass again.
   */
  private renewGlass(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    const root = document.documentElement;
    root.setAttribute(GLASS_RENEW, '');
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute(GLASS_RENEW)));
  }

  private apply(): void {
    const root = document.documentElement;
    const effective = this.effective();
    SETTINGS.forEach((setting) => {
      const [name, on, off] = DISPLAY_ATTRIBUTES[setting];
      root.setAttribute(name, effective[setting] ? on : off);
    });
  }

  private readSystem(): Record<DisplaySetting, boolean> {
    return Object.fromEntries(
      SETTINGS.map((s) => [s, matchList(DISPLAY_MEDIA[s])?.matches ?? false]),
    ) as Record<DisplaySetting, boolean>;
  }

  private readStored(): DisplayChoices {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(this.key) ?? '{}');
      if (raw === null || typeof raw !== 'object') return {};
      const record = raw as Record<string, unknown>;
      return Object.fromEntries(
        SETTINGS.filter((s) => typeof record[s] === 'boolean').map((s) => [s, record[s]]),
      ) as DisplayChoices;
    } catch {
      /* storage blocked or the value is no JSON: the system applies */
      return {};
    }
  }

  private persist(): void {
    try {
      const choices = this._choices();
      if (Object.keys(choices).length === 0) localStorage.removeItem(this.key);
      else localStorage.setItem(this.key, JSON.stringify(choices));
    } catch {
      /* storage blocked or full: the choice holds for this session only */
    }
  }
}
