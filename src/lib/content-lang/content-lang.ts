import { InjectionToken, type Signal, computed, inject, Injectable, signal } from '@angular/core';
import { UI_KIT_INTL } from '../intl/intl';

/** A text in each content language: `{ de: '…', en: '…' }`. */
export type I18nMap = Readonly<Record<string, string>>;

/**
 * The languages that an editor writes its texts in, a copy of the language parts of the
 * I18nService of STUPA-Workflow: DE, EN and the extra languages of the app.
 */
export interface ContentLanguages {
  /** Every content language: DE, EN, then the extra languages. */
  readonly locales: Signal<readonly string[]>;
  /** The language of the page, where a new editor starts. */
  readonly current: Signal<string>;
  /** The native name of a language: "Deutsch", "English". */
  name(code: string): string;
}

/**
 * The content languages of the app. Without a provider they are DE and EN, and the editor
 * starts in the language of the kit texts.
 */
export const CONTENT_LANGUAGES = new InjectionToken<ContentLanguages>('CONTENT_LANGUAGES', {
  providedIn: 'root',
  factory: () => {
    const intl = inject(UI_KIT_INTL);
    return {
      locales: signal<readonly string[]>(['de', 'en']),
      current: computed(() => intl.lang()),
      name: (code: string) => (code === 'de' ? 'Deutsch' : code === 'en' ? 'English' : code.toUpperCase()),
    };
  },
});

/**
 * The content language of one editor: the language that its text fields show. The editor
 * provides it (`providers: [ContentLangState]`), `app-content-lang-switch` sets it with
 * `[(value)]="contentLang.lang"`, and every `app-i18n-input` inside reads it. It starts with
 * the language of the page.
 */
@Injectable()
export class ContentLangState {
  /** `de`, `en` or the code of an extra language. */
  readonly lang = signal(inject(CONTENT_LANGUAGES).current());
}

/**
 * The locales whose texts a language shows, the first one first: DE alone, EN then DE, an
 * extra language then EN then DE.
 */
export function fallbackChain(lang: string): readonly string[] {
  if (lang === 'de') return ['de'];
  if (lang === 'en') return ['en', 'de'];
  return [lang, 'en', 'de'];
}

/** The label of the field of one language: `Bezeichnung (DE)`, `Bezeichnung (PT-BR)`. */
export function langFieldLabel(label: string, lang: string): string {
  return `${label} (${lang.toUpperCase()})`;
}

/**
 * Set the text of one language in a map and return a new map. An empty text of an extra
 * language removes its entry, so the language falls back along its chain instead of showing
 * an empty text. DE and EN keep an empty entry, as the editors always wrote them.
 */
export function setI18n(map: I18nMap | null | undefined, lang: string, text: string): I18nMap {
  const drop = text === '' && lang !== 'de' && lang !== 'en';
  return drop
    ? Object.fromEntries(Object.entries(map ?? {}).filter(([code]) => code !== lang))
    : { ...map, [lang]: text };
}
