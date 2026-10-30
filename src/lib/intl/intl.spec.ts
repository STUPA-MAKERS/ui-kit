import { Injectable, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DefaultUiKitIntl,
  UI_KIT_FORMAT_LOCALES,
  UI_KIT_INTL,
  provideUiKit,
  uiKitIntlFromLang,
} from './intl';

describe('UiKitIntl', () => {
  it('maps each language to its format locale (EN is en-GB, not en-US)', () => {
    expect(UI_KIT_FORMAT_LOCALES).toEqual({ de: 'de-DE', en: 'en-GB' });
    const intl = new DefaultUiKitIntl();
    intl.setLang('de');
    expect(intl.formatLocale()).toBe('de-DE');
    intl.setLang('en');
    expect(intl.formatLocale()).toBe('en-GB');
  });

  it('follows an external language signal', () => {
    const lang = signal<'de' | 'en'>('de');
    const intl = uiKitIntlFromLang(lang);
    expect(intl.formatLocale()).toBe('de-DE');
    lang.set('en');
    expect(intl.formatLocale()).toBe('en-GB');
  });

  it('takes the format locale of the host app when given', () => {
    const fmt = signal('en-IE');
    const intl = uiKitIntlFromLang(signal('en' as const), undefined, fmt);
    expect(intl.formatLocale()).toBe('en-IE');
    fmt.set('de-AT');
    expect(intl.formatLocale()).toBe('de-AT');
  });

  it('translates with parameters and keeps unknown placeholders', () => {
    const intl = uiKitIntlFromLang(signal('en' as const), {
      en: { loading: 'Loading {what} {other}' },
    });
    expect(intl.translate('loading', { what: 'rows' })).toBe('Loading rows {other}');
  });

  it('provideUiKit registers the default implementation', () => {
    TestBed.configureTestingModule({
      providers: [provideUiKit({ lang: signal('en' as const) })],
    });
    const intl = TestBed.inject(UI_KIT_INTL);
    expect(intl.formatLocale()).toBe('en-GB');
    expect(intl.translate('dialog.close')).toBe('Close');
  });

  it('provideUiKit takes an intl factory that injects a service provided after it', () => {
    @Injectable()
    class AppLang {
      readonly lang = signal('en' as const);
    }
    TestBed.configureTestingModule({
      providers: [
        provideUiKit({ intl: () => uiKitIntlFromLang(inject(AppLang).lang) }),
        AppLang,
      ],
    });
    expect(TestBed.inject(UI_KIT_INTL).translate('dialog.close')).toBe('Close');
  });
});
