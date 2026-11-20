import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UI_KIT_INTL, UI_KIT_THEME } from '@stupa-makers/ui-kit';

import { fakePorts, fullConfig, minimalConfig } from '../../../testing/framework';
import {
  FRAMEWORK,
  frameworkParts,
  kitLang,
  provideFramework,
  withTextOverrides,
} from './framework';

function setUp(config = minimalConfig()): void {
  TestBed.configureTestingModule({ providers: [provideFramework(config)] });
}

// §S/framework/shell/002260
describe('provideFramework', () => {
  it('registers the minimal config with the kit defaults', () => {
    const config = minimalConfig();
    setUp(config);
    expect(TestBed.inject(FRAMEWORK)).toBe(config);
    expect(TestBed.inject(UI_KIT_THEME).storageKey).toBe('demo.theme');
    expect(TestBed.inject(UI_KIT_THEME).manifest).toEqual({
      light: 'manifest.webmanifest',
      dark: 'manifest.webmanifest?scheme=dark',
    });
    expect(TestBed.inject(UI_KIT_INTL).translate('dialog.close')).toBeTruthy();
  });

  it('takes the manifest and the text overrides of the full config', () => {
    setUp(fullConfig({ 'kit.dialog.close': 'Zu' }));
    expect(TestBed.inject(UI_KIT_THEME).manifest).toEqual({ light: 'm.json', dark: 'm.json?dark' });
    expect(TestBed.inject(UI_KIT_INTL).translate('dialog.close')).toBe('Zu');
  });

  it('follows the language of the config', () => {
    const current = signal('de');
    setUp({ ...minimalConfig(), language: { current, set: () => undefined } });
    const intl = TestBed.inject(UI_KIT_INTL);
    expect(intl.lang()).toBe('de');
    current.set('en');
    expect(intl.lang()).toBe('en');
  });

  it('maps a language without kit texts to English', () => {
    expect(kitLang('fr')).toBe('en');
    expect(kitLang('de-AT')).toBe('de');
  });
});

// §S/framework/texts/002223
describe('withTextOverrides', () => {
  const base = {
    lang: signal<'de' | 'en'>('de'),
    formatLocale: signal('de-DE'),
    translate: (key: string) => `base:${key}`,
  };

  it('keeps the kit text without an override', () => {
    expect(withTextOverrides(base, signal({})).translate('loading')).toBe('base:loading');
  });

  it('fills the parameters of an override', () => {
    const texts = signal({ 'kit.loading': 'Lädt {name}' });
    expect(withTextOverrides(base, texts).translate('loading', { name: 'X' })).toBe('Lädt X');
  });

  it('follows a change of the overrides', () => {
    const texts = signal<Record<string, string>>({});
    const intl = withTextOverrides(base, texts);
    texts.set({ 'kit.loading': 'Neu' });
    expect(intl.translate('loading')).toBe('Neu');
  });
});

// §S/framework/shell/002261
describe('frameworkParts', () => {
  it('hides every part whose field or port is missing', () => {
    expect(frameworkParts(minimalConfig())()).toEqual({
      search: false,
      help: false,
      account: false,
      footer: false,
      report: false,
    });
  });

  it('shows every part of the full config', () => {
    expect(frameworkParts(fullConfig())()).toEqual({
      search: true,
      help: true,
      account: true,
      footer: true,
      report: true,
    });
  });

  it('follows the session', () => {
    const person = signal<{ name: string } | null>(null);
    const config = {
      ...minimalConfig(),
      ports: fakePorts({ session: { frame: signal('rail'), person, logout: () => undefined } }),
    };
    const parts = frameworkParts(config);
    expect(parts().account).toBe(false);
    person.set({ name: 'Ada' });
    expect(parts().account).toBe(true);
  });
});
