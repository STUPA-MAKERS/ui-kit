import {
  InjectionToken,
  type EnvironmentProviders,
  type Signal,
  computed,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { UI_KIT_THEME, type UiKitThemeOptions, uiKitThemeConfig } from '../theme/theme.config';

/** Languages the built-in catalogue ships. Consumers may map their own onto these. */
export type UiLang = 'de' | 'en';

/**
 * The `Intl` locale tag behind each kit language. The language is a catalogue key, not a
 * format locale: bare `en` makes `Intl` use US order (`07/01/2026`, `7:50 PM`). EN
 * therefore formats as `en-GB` (`01/07/2026`, 24 h clock), like DE.
 */
export const UI_KIT_FORMAT_LOCALES: Record<UiLang, string> = { de: 'de-DE', en: 'en-GB' };

/** Every translatable string the kit renders itself. */
export type UiKitTextKey =
  | 'dialog.close'
  | 'loading'
  | 'datepicker.openCalendar'
  | 'diff.none'
  | 'diff.changed'
  | 'diff.added'
  | 'diff.removed'
  | 'diff.label'
  | 'diff.before'
  | 'diff.after'
  | 'diff.noneCompact'
  | 'table.scrollStart'
  | 'table.scrollEnd'
  | 'currency.invalid'
  | 'copy.copy'
  | 'copy.copied'
  | 'move.up'
  | 'move.down'
  | 'options.empty'
  | 'range.from'
  | 'range.to'
  | 'range.fromOnly'
  | 'range.toOnly'
  | 'range.apply'
  | 'range.reset'
  | 'range.invalid'
  | 'rowMenu.trigger'
  | 'rowMenu.empty'
  | 'rowMenu.loading'
  | 'note.retry'
  | 'confirm.cancel'
  | 'confirm.delete'
  | 'selection.toolbar'
  | 'selection.selectAll'
  | 'selection.clear'
  | 'selection.count'
  | 'listDetail.back'
  | 'search.clear'
  | 'avatar.more'
  | 'viewer.close'
  | 'viewer.previous'
  | 'viewer.next'
  | 'viewer.position'
  | 'viewer.error'
  | 'viewer.noPreview'
  | 'editorTable.columnMenu'
  | 'editorTable.rowMenu'
  | 'editorTable.menu'
  | 'editorTable.insertColumnLeft'
  | 'editorTable.insertColumnRight'
  | 'editorTable.deleteColumn'
  | 'editorTable.insertRowAbove'
  | 'editorTable.insertRowBelow'
  | 'editorTable.deleteRow'
  | 'editorTable.addRow'
  | 'editorTable.addColumn'
  | 'editorTable.delete'
  | 'pwa.updateReady'
  | 'pwa.reload';

export type UiKitMessages = Record<UiKitTextKey, string>;

/** Built-in DE/EN strings — the kit renders identically out of the box. */
export const UI_KIT_DEFAULT_MESSAGES: Record<UiLang, UiKitMessages> = {
  de: {
    'dialog.close': 'Schließen',
    loading: 'Wird geladen…',
    'datepicker.openCalendar': 'Kalender öffnen',
    'diff.none': 'Keine Feldänderungen.',
    'diff.changed': 'Geändert',
    'diff.added': 'Hinzugefügt',
    'diff.removed': 'Entfernt',
    'diff.label': 'Änderungen',
    'diff.before': 'vorher',
    'diff.after': 'nachher',
    'diff.noneCompact': 'Keine Änderungen',
    'table.scrollStart': 'Tabelle nach links scrollen',
    'table.scrollEnd': 'Tabelle nach rechts scrollen',
    'currency.invalid': 'Kein gültiger Betrag. Beispiel: 1.234,56 (höchstens 2 Nachkommastellen).',
    'copy.copy': 'Kopieren',
    'copy.copied': 'Kopiert',
    'move.up': 'Nach oben',
    'move.down': 'Nach unten',
    'options.empty': 'Keine Auswahl möglich',
    'range.from': 'von',
    'range.to': 'bis',
    'range.fromOnly': 'ab {value}',
    'range.toOnly': 'bis {value}',
    'range.apply': 'Anwenden',
    'range.reset': 'Zurücksetzen',
    'range.invalid': 'Der Anfang liegt nach dem Ende.',
    'rowMenu.trigger': 'Weitere Aktionen',
    'rowMenu.empty': 'Keine Aktionen möglich',
    'rowMenu.loading': 'Wird geladen …',
    'note.retry': 'Erneut versuchen',
    'confirm.cancel': 'Abbrechen',
    'confirm.delete': 'Löschen',
    'selection.toolbar': 'Auswahl',
    'selection.selectAll': 'Alle wählen',
    'selection.clear': 'Auswahl aufheben',
    'selection.count': '{count} ausgewählt',
    'listDetail.back': 'Zur Liste',
    'search.clear': 'Suche leeren',
    'avatar.more': '{count} weitere',
    'viewer.close': 'Vorschau schließen',
    'viewer.previous': 'Vorherige Datei',
    'viewer.next': 'Nächste Datei',
    'viewer.position': '{n} von {total}',
    'viewer.error': 'Die Datei kann nicht angezeigt werden.',
    'viewer.noPreview': 'Für diese Datei gibt es keine Vorschau.',
    'editorTable.columnMenu': 'Spalte',
    'editorTable.rowMenu': 'Zeile',
    'editorTable.menu': 'Tabelle',
    'editorTable.insertColumnLeft': 'Spalte links einfügen',
    'editorTable.insertColumnRight': 'Spalte rechts einfügen',
    'editorTable.deleteColumn': 'Spalte löschen',
    'editorTable.insertRowAbove': 'Zeile oberhalb einfügen',
    'editorTable.insertRowBelow': 'Zeile unterhalb einfügen',
    'editorTable.deleteRow': 'Zeile löschen',
    'editorTable.addRow': 'Zeile hinzufügen',
    'editorTable.addColumn': 'Spalte hinzufügen',
    'editorTable.delete': 'Tabelle löschen',
    'pwa.updateReady': 'Eine neue Version der App ist verfügbar.',
    'pwa.reload': 'Neu laden',
  },
  en: {
    'dialog.close': 'Close',
    loading: 'Loading…',
    'datepicker.openCalendar': 'Open calendar',
    'diff.none': 'No field changes.',
    'diff.changed': 'Changed',
    'diff.added': 'Added',
    'diff.removed': 'Removed',
    'diff.label': 'Changes',
    'diff.before': 'before',
    'diff.after': 'after',
    'diff.noneCompact': 'No changes',
    'table.scrollStart': 'Scroll the table left',
    'table.scrollEnd': 'Scroll the table right',
    'currency.invalid': 'Not a valid amount. Example: 1,234.56 (at most 2 decimals).',
    'copy.copy': 'Copy',
    'copy.copied': 'Copied',
    'move.up': 'Move up',
    'move.down': 'Move down',
    'options.empty': 'No options available',
    'range.from': 'from',
    'range.to': 'to',
    'range.fromOnly': 'from {value}',
    'range.toOnly': 'up to {value}',
    'range.apply': 'Apply',
    'range.reset': 'Reset',
    'range.invalid': 'The start is after the end.',
    'rowMenu.trigger': 'More actions',
    'rowMenu.empty': 'No actions available',
    'rowMenu.loading': 'Loading …',
    'note.retry': 'Try again',
    'confirm.cancel': 'Cancel',
    'confirm.delete': 'Delete',
    'selection.toolbar': 'Selection',
    'selection.selectAll': 'Select all',
    'selection.clear': 'Clear selection',
    'selection.count': '{count} selected',
    'listDetail.back': 'Back to list',
    'search.clear': 'Clear search',
    'avatar.more': '{count} more',
    'viewer.close': 'Close preview',
    'viewer.previous': 'Previous file',
    'viewer.next': 'Next file',
    'viewer.position': '{n} of {total}',
    'viewer.error': 'The file cannot be displayed.',
    'viewer.noPreview': 'There is no preview for this file.',
    'editorTable.columnMenu': 'Column',
    'editorTable.rowMenu': 'Row',
    'editorTable.menu': 'Table',
    'editorTable.insertColumnLeft': 'Insert column left',
    'editorTable.insertColumnRight': 'Insert column right',
    'editorTable.deleteColumn': 'Delete column',
    'editorTable.insertRowAbove': 'Insert row above',
    'editorTable.insertRowBelow': 'Insert row below',
    'editorTable.deleteRow': 'Delete row',
    'editorTable.addRow': 'Add row',
    'editorTable.addColumn': 'Add column',
    'editorTable.delete': 'Delete table',
    'pwa.updateReady': 'A new version of the app is available.',
    'pwa.reload': 'Reload',
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
  /**
   * The `Intl` tag for numbers and dates (`de-DE` / `en-GB`). Every `Intl.NumberFormat`
   * and `Intl.DateTimeFormat` of the kit reads it, never the bare {@link lang}.
   */
  readonly formatLocale: Signal<string>;
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
  /**
   * External format-locale signal (e.g. the host app's `Intl` tag). Omit to map the
   * language through {@link UI_KIT_FORMAT_LOCALES}.
   */
  formatLocale?: Signal<string>;
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
  readonly formatLocale: Signal<string>;
  private readonly messages: Record<UiLang, UiKitMessages>;

  constructor(options: UiKitIntlOptions = {}) {
    this.lang = options.lang ?? this.internalLang.asReadonly();
    const lang = this.lang;
    this.formatLocale =
      options.formatLocale ?? computed(() => UI_KIT_FORMAT_LOCALES[lang()]);
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

/**
 * Build a {@link UiKitIntl} whose language tracks the given signal (e.g. an app locale).
 * Pass `formatLocale` when the host app has its own `Intl` tag, so kit numbers and dates
 * format like the app.
 */
export function uiKitIntlFromLang(
  lang: Signal<UiLang>,
  messages?: UiKitIntlOptions['messages'],
  formatLocale?: Signal<string>,
): UiKitIntl {
  return new DefaultUiKitIntl({ lang, messages, formatLocale });
}

/** Options of {@link provideUiKit}. */
export interface UiKitOptions extends UiKitIntlOptions {
  /** A ready {@link UiKitIntl}. It wins over `lang`, `formatLocale` and `messages`. */
  intl?: UiKitIntl;
  /**
   * The settings of the `ThemeService`: the storage key of the preference, the manifest
   * URL per theme and the page background per theme. Omit a field to keep its default.
   */
  theme?: UiKitThemeOptions;
}

/**
 * Register the kit's i18n and theme settings. Pass a ready {@link UiKitIntl} via `intl`, or
 * `lang`/`messages` to configure the default implementation. With no argument the
 * built-in catalogue and the default theme settings are used.
 */
export function provideUiKit(options: UiKitOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: UI_KIT_INTL,
      useFactory: () => options.intl ?? new DefaultUiKitIntl(options),
    },
    { provide: UI_KIT_THEME, useValue: uiKitThemeConfig(options.theme) },
  ]);
}
