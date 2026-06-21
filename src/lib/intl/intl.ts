import {
  InjectionToken,
  type EnvironmentProviders,
  type Signal,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

/** Languages the built-in catalogue ships. Consumers may map their own onto these. */
export type UiLang = 'de' | 'en';

/** Every translatable string the kit renders itself. */
export type UiKitTextKey =
  | 'dialog.close'
  | 'loading'
  | 'datepicker.openCalendar'
  | 'filter.button'
  | 'filter.apply'
  | 'filter.reset'
  | 'diff.none'
  | 'diff.changed'
  | 'diff.added'
  | 'diff.removed';

export type UiKitMessages = Record<UiKitTextKey, string>;

/** Built-in DE/EN strings — the kit renders identically out of the box. */
export const UI_KIT_DEFAULT_MESSAGES: Record<UiLang, UiKitMessages> = {
  de: {
    'dialog.close': 'Schließen',
    loading: 'Wird geladen…',
    'datepicker.openCalendar': 'Kalender öffnen',
    'filter.button': 'Filter',
    'filter.apply': 'Anwenden',
    'filter.reset': 'Zurücksetzen',
    'diff.none': 'Keine Feldänderungen.',
    'diff.changed': 'Geändert',
    'diff.added': 'Hinzugefügt',
    'diff.removed': 'Entfernt',
  },
  en: {
    'dialog.close': 'Close',
    loading: 'Loading…',
    'datepicker.openCalendar': 'Open calendar',
    'filter.button': 'Filter',
    'filter.apply': 'Apply',
    'filter.reset': 'Reset',
    'diff.none': 'No field changes.',
    'diff.changed': 'Changed',
    'diff.added': 'Added',
    'diff.removed': 'Removed',
  },
};

/**
 * The kit's i18n contract. The host app provides one (see {@link provideUiKit} /
 * {@link uiKitIntlFromLang}) to drive language + strings from its own system; if it
 * does nothing, a built-in DE/EN {@link DefaultUiKitIntl} is used.
 */
export interface UiKitIntl {
  /** Active language as a signal — components react to changes without re-render hacks. */
  readonly lang: Signal<UiLang>;
  translate(key: UiKitTextKey, params?: Record<string, string | number>): string;
}

const DEFAULT_LANG: UiLang = 'de';

function detectLang(): UiLang {
  if (typeof navigator === 'undefined') return DEFAULT_LANG;
  return navigator.language.slice(0, 2).toLowerCase() === 'en' ? 'en' : 'de';
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export interface UiKitIntlOptions {
  /** External language signal (e.g. the host app's locale). Omit for an internal, settable one. */
  lang?: Signal<UiLang>;
  /** Partial message overrides merged over the built-in DE/EN catalogue. */
  messages?: Partial<Record<UiLang, Partial<UiKitMessages>>>;
}

/**
 * Default {@link UiKitIntl}: ships the built-in DE/EN catalogue. Language follows an
 * injected signal when given (so it tracks the host app's locale), otherwise an
 * internal signal seeded from the browser and settable via {@link setLang}.
 */
export class DefaultUiKitIntl implements UiKitIntl {
  private readonly internalLang = signal<UiLang>(detectLang());
  readonly lang: Signal<UiLang>;
  private readonly messages: Record<UiLang, UiKitMessages>;

  constructor(options: UiKitIntlOptions = {}) {
    this.lang = options.lang ?? this.internalLang.asReadonly();
    this.messages = {
      de: { ...UI_KIT_DEFAULT_MESSAGES.de, ...(options.messages?.de ?? {}) },
      en: { ...UI_KIT_DEFAULT_MESSAGES.en, ...(options.messages?.en ?? {}) },
    };
  }

  /** Set the language. Only effective when no external `lang` signal was provided. */
  setLang(lang: UiLang): void {
    this.internalLang.set(lang);
  }

  translate(key: UiKitTextKey, params?: Record<string, string | number>): string {
    const raw = this.messages[this.lang()][key] ?? this.messages[DEFAULT_LANG][key] ?? key;
    return interpolate(raw, params);
  }
}

/** DI token for the kit's i18n. Defaults to a built-in DE/EN {@link DefaultUiKitIntl}. */
export const UI_KIT_INTL = new InjectionToken<UiKitIntl>('UI_KIT_INTL', {
  providedIn: 'root',
  factory: () => new DefaultUiKitIntl(),
});

/** Build a {@link UiKitIntl} whose language tracks the given signal (e.g. an app locale). */
export function uiKitIntlFromLang(
  lang: Signal<UiLang>,
  messages?: UiKitIntlOptions['messages'],
): UiKitIntl {
  return new DefaultUiKitIntl({ lang, messages });
}

/**
 * Register the kit's i18n. Pass a ready {@link UiKitIntl} via `intl`, or `lang`/`messages`
 * to configure the default implementation. With no argument the built-in catalogue is used.
 */
export function provideUiKit(
  options: UiKitIntlOptions & { intl?: UiKitIntl } = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: UI_KIT_INTL,
      useFactory: () => options.intl ?? new DefaultUiKitIntl(options),
    },
  ]);
}
