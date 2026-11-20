/** Fake ports and configs of `provideFramework()` for the specs (002261). */
import { signal } from '@angular/core';
import { of } from 'rxjs';
import type { FrameworkConfig, FrameworkPorts } from '../shell/src/framework/framework';
import { NAV } from './shell';

/** Ports with a signed-in person and every optional port set. */
export function fakePorts(overrides: Partial<FrameworkPorts> = {}): FrameworkPorts {
  return {
    session: {
      frame: signal('rail'),
      person: signal({ name: 'Ada Lovelace' }),
      logout: jest.fn(),
    },
    search: () => of([]),
    avatar: () => null,
    navMarks: signal({}),
    report: jest.fn(async () => undefined),
    upload: jest.fn(async (file: File) => ({ url: `/files/${file.name}`, name: file.name })),
    live: signal('online'),
    display: { load: jest.fn(async () => null), save: jest.fn(async () => undefined) },
    ...overrides,
  };
}

/** The smallest config: only the required fields, and only the session port. */
export function minimalConfig(): FrameworkConfig {
  return {
    brand: { name: 'Demo', home: '/', mark: '/assets/mark.svg' },
    nav: signal(NAV),
    bar: signal(['start', 'applications']),
    a11yStatement: { commands: ['/accessibility'] },
    languages: [{ value: 'de', label: 'Deutsch' }],
    language: { current: signal('de'), set: () => undefined },
    theme: { storageKey: 'demo.theme' },
    ports: {
      session: { frame: signal('public'), person: signal(null), logout: () => undefined },
    },
  };
}

/** A config with every field and every port. */
export function fullConfig(texts: Record<string, string> = {}): FrameworkConfig {
  return {
    ...minimalConfig(),
    brand: { name: 'Demo', home: '/', mark: { light: '/l.svg', dark: '/d.svg' }, accent: '#0a7' },
    account: { items: signal([{ key: 'profile', label: 'Profil' }]) },
    help: { items: signal([{ key: 'wiki', label: 'Wiki' }]), wikiUrl: 'https://wiki.example' },
    footer: { links: [{ label: 'Impressum', link: { commands: ['/imprint'] } }] },
    languages: [
      { value: 'de', label: 'Deutsch' },
      { value: 'en', label: 'English' },
    ],
    texts: signal(texts),
    theme: { storageKey: 'demo.theme', manifest: { light: 'm.json', dark: 'm.json?dark' } },
    ports: fakePorts(),
  };
}
