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
  | 'screen.more'
  | 'screen.select'
  | 'screen.selectRow'
  | 'screen.selectStop'
  | 'confirm.cancel'
  | 'confirm.delete'
  | 'selection.toolbar'
  | 'selection.selectAll'
  | 'selection.clear'
  | 'selection.count'
  | 'listDetail.back'
  | 'screen.back'
  | 'form.required'
  | 'form.maxLength'
  | 'form.pattern'
  | 'form.email'
  | 'form.url'
  | 'form.iban'
  | 'form.number'
  | 'form.min'
  | 'form.max'
  | 'form.minDate'
  | 'form.maxDate'
  | 'form.range'
  | 'form.repeatMin'
  | 'form.repeatMax'
  | 'form.removeRow'
  | 'form.pickFile'
  | 'form.removeFile'
  | 'form.tooLarge'
  | 'form.uploadFailed'
  | 'form.drop'
  | 'form.uploading'
  | 'form.wrongType'
  | 'search.clear'
  | 'search.results'
  | 'search.resultsOne'
  | 'search.none'
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
  | 'editorDocument.open'
  | 'editorDocument.pages'
  | 'editorDocument.page'
  | 'pwa.updateReady'
  | 'pwa.reload'
  | 'pwa.offline'
  | 'shell.skip'
  | 'shell.mainNav'
  | 'shell.more'
  | 'shell.search'
  | 'shell.brand'
  | 'shell.markNew'
  | 'shell.markWarn'
  | 'menu.help'
  | 'menu.a11y'
  | 'menu.display'
  | 'menu.display.reset'
  | 'menu.display.dark'
  | 'menu.display.motion'
  | 'menu.display.transparency'
  | 'menu.display.contrast'
  | 'menu.display.veryHigh'
  | 'menu.statement'
  | 'menu.reportBarrier'
  | 'account.signedInAs'
  | 'account.language'
  | 'account.darkMode'
  | 'account.logout'
  | 'account.open'
  | 'account.region'
  | 'palette.title'
  | 'palette.placeholder'
  | 'palette.close'
  | 'palette.empty'
  | 'palette.pages'
  | 'palette.truncated'
  | 'palette.keysSelect'
  | 'palette.keysOpen'
  | 'palette.archived';

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
    'screen.more': 'Mehr laden',
    'screen.select': 'Mehrere auswählen',
    'screen.selectRow': '{title} auswählen',
    'screen.selectStop': 'Auswahl beenden',
    'confirm.cancel': 'Abbrechen',
    'confirm.delete': 'Löschen',
    'selection.toolbar': 'Auswahl',
    'selection.selectAll': 'Alle wählen',
    'selection.clear': 'Auswahl aufheben',
    'selection.count': '{count} ausgewählt',
    'listDetail.back': 'Zur Liste',
    'screen.back': 'Zurück',
    'form.required': 'Bitte ausfüllen.',
    'form.maxLength': 'Höchstens {n} Zeichen.',
    'form.pattern': 'Das Format stimmt nicht.',
    'form.email': 'Keine gültige E-Mail-Adresse.',
    'form.url': 'Keine gültige Adresse. Beispiel: https://example.org',
    'form.iban': 'Keine gültige IBAN.',
    'form.number': 'Keine gültige Zahl.',
    'form.min': 'Mindestens {n}.',
    'form.max': 'Höchstens {n}.',
    'form.minDate': 'Frühestens am {d}.',
    'form.maxDate': 'Spätestens am {d}.',
    'form.range': 'Der Anfang liegt nach dem Ende.',
    'form.repeatMin': 'Mindestens {n} Einträge.',
    'form.repeatMax': 'Höchstens {n} Einträge.',
    'form.removeRow': 'Eintrag {n} entfernen',
    'form.pickFile': 'Auswählen',
    'form.removeFile': '{name} entfernen',
    'form.tooLarge': 'Die Datei ist zu groß.',
    'form.uploadFailed': 'Die Datei konnte nicht hochgeladen werden.',
    'form.drop': 'Dateien hierher ziehen oder auswählen',
    'form.uploading': 'Wird hochgeladen …',
    'form.wrongType': 'Diese Art von Datei geht hier nicht.',
    'search.clear': 'Suche leeren',
    'search.results': '{n} Treffer',
    'search.resultsOne': '1 Treffer',
    'search.none': 'Keine Treffer',
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
    'editorDocument.open': 'PDF öffnen: {name}',
    'editorDocument.pages': '{n} Seiten',
    'editorDocument.page': '1 Seite',
    'pwa.updateReady': 'Eine neue Version der App ist bereit.',
    'pwa.reload': 'Neu laden',
    'pwa.offline': 'Keine Verbindung',
    'shell.skip': 'Zum Inhalt springen',
    'shell.mainNav': 'Hauptnavigation',
    'shell.more': 'Mehr',
    'shell.search': 'Suche',
    'shell.brand': '{name}, Start',
    'shell.markNew': 'neu',
    'shell.markWarn': 'Achtung',
    'menu.help': 'Hilfe',
    'menu.a11y': 'Barrierefreiheit',
    'menu.display': 'Darstellung',
    'menu.display.reset': 'Systemeinstellungen verwenden',
    'menu.display.dark': 'Dunkles Design',
    'menu.display.motion': 'Weniger Bewegung',
    'menu.display.transparency': 'Weniger Transparenz',
    'menu.display.contrast': 'Mehr Kontrast',
    'menu.display.veryHigh': 'Hoher Kontrast',
    'menu.statement': 'Erklärung zur Barrierefreiheit',
    'menu.reportBarrier': 'Barriere melden',
    'account.signedInAs': 'Angemeldet als',
    'account.language': 'Sprache',
    'account.darkMode': 'Dunkles Design',
    'account.logout': 'Abmelden',
    'account.open': 'Konto: {name}',
    'account.region': 'Konto',
    'palette.title': 'Suche',
    'palette.placeholder': 'Suchen …',
    'palette.close': 'Suche schließen',
    'palette.empty': 'Nichts gefunden.',
    'palette.pages': 'Seiten',
    'palette.truncated': 'Es gibt weitere Treffer. Suchbegriff eingrenzen.',
    'palette.keysSelect': 'Auswählen',
    'palette.keysOpen': 'Öffnen',
    'palette.archived': 'Archiviert',
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
    'screen.more': 'Load more',
    'screen.select': 'Select several',
    'screen.selectRow': 'Select {title}',
    'screen.selectStop': 'End selection',
    'confirm.cancel': 'Cancel',
    'confirm.delete': 'Delete',
    'selection.toolbar': 'Selection',
    'selection.selectAll': 'Select all',
    'selection.clear': 'Clear selection',
    'selection.count': '{count} selected',
    'listDetail.back': 'Back to list',
    'screen.back': 'Back',
    'form.required': 'Please fill in.',
    'form.maxLength': 'At most {n} characters.',
    'form.pattern': 'The format is not valid.',
    'form.email': 'Not a valid e-mail address.',
    'form.url': 'Not a valid address. Example: https://example.org',
    'form.iban': 'Not a valid IBAN.',
    'form.number': 'Not a valid number.',
    'form.min': 'At least {n}.',
    'form.max': 'At most {n}.',
    'form.minDate': 'Not before {d}.',
    'form.maxDate': 'Not after {d}.',
    'form.range': 'The start is after the end.',
    'form.repeatMin': 'At least {n} entries.',
    'form.repeatMax': 'At most {n} entries.',
    'form.removeRow': 'Remove entry {n}',
    'form.pickFile': 'Choose',
    'form.removeFile': 'Remove {name}',
    'form.tooLarge': 'The file is too large.',
    'form.uploadFailed': 'The file could not be uploaded.',
    'form.drop': 'Drag files here or choose them',
    'form.uploading': 'Uploading …',
    'form.wrongType': 'This kind of file is not allowed here.',
    'search.clear': 'Clear search',
    'search.results': '{n} results',
    'search.resultsOne': '1 result',
    'search.none': 'No results',
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
    'editorDocument.open': 'Open PDF: {name}',
    'editorDocument.pages': '{n} pages',
    'editorDocument.page': '1 page',
    'pwa.updateReady': 'A new version of the app is ready.',
    'pwa.reload': 'Reload',
    'pwa.offline': 'You are offline',
    'shell.skip': 'Skip to content',
    'shell.mainNav': 'Main navigation',
    'shell.more': 'More',
    'shell.search': 'Search',
    'shell.brand': '{name}, home',
    'shell.markNew': 'new',
    'shell.markWarn': 'attention',
    'menu.help': 'Help',
    'menu.a11y': 'Accessibility',
    'menu.display': 'Display',
    'menu.display.reset': 'Use system settings',
    'menu.display.dark': 'Dark theme',
    'menu.display.motion': 'Less motion',
    'menu.display.transparency': 'Less transparency',
    'menu.display.contrast': 'More contrast',
    'menu.display.veryHigh': 'High contrast',
    'menu.statement': 'Accessibility statement',
    'menu.reportBarrier': 'Report a barrier',
    'account.signedInAs': 'Signed in as',
    'account.language': 'Language',
    'account.darkMode': 'Dark theme',
    'account.logout': 'Sign out',
    'account.open': 'Account: {name}',
    'account.region': 'Account',
    'palette.title': 'Search',
    'palette.placeholder': 'Search …',
    'palette.close': 'Close search',
    'palette.empty': 'Nothing found.',
    'palette.pages': 'Pages',
    'palette.truncated': 'There are more results. Narrow the query.',
    'palette.keysSelect': 'Select',
    'palette.keysOpen': 'Open',
    'palette.archived': 'Archived',
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
  readonly lang?: Signal<UiLang>;
  /**
   * External format-locale signal (e.g. the host app's `Intl` tag). Omit to map the
   * language through {@link UI_KIT_FORMAT_LOCALES}.
   */
  readonly formatLocale?: Signal<string>;
  /** Partial message overrides merged over the built-in DE/EN catalogue. */
  readonly messages?: Partial<Record<UiLang, Partial<UiKitMessages>>>;
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
  /**
   * A ready {@link UiKitIntl}, or a factory for one. It wins over `lang`, `formatLocale` and
   * `messages`. The factory runs in an injection context when the kit first needs its
   * texts, so it can `inject()` the i18n service of the app, and the order of the providers
   * does not matter.
   */
  readonly intl?: UiKitIntl | (() => UiKitIntl);
  /**
   * The settings of the `ThemeService`: the storage key of the preference, the manifest
   * URL per theme and the page background per theme. Omit a field to keep its default.
   */
  readonly theme?: UiKitThemeOptions;
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
      useFactory: (): UiKitIntl => {
        const intl = options.intl;
        if (typeof intl === 'function') return intl();
        return intl ?? new DefaultUiKitIntl(options);
      },
    },
    { provide: UI_KIT_THEME, useValue: uiKitThemeConfig(options.theme) },
  ]);
}
