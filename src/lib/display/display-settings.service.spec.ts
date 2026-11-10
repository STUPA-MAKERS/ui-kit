import { TestBed } from '@angular/core/testing';
import { UI_KIT_THEME_DEFAULTS } from '../theme/theme.config';
import { reducedMotion } from '../motion/motion';
import { motionReduced } from '../gesture/gesture';
import { DisplaySettingsService } from './display-settings.service';

/** App spec 000594: a display setting follows the system until the person sets it. */
const KEY = `${UI_KIT_THEME_DEFAULTS.storageKey}.display`;
const original = window.matchMedia;
const root = document.documentElement;

describe('DisplaySettingsService (§000594)', () => {
  let system: Record<string, boolean>;
  let handlers: Record<string, (e: MediaQueryListEvent) => void>;

  beforeEach(() => {
    localStorage.clear();
    system = {};
    handlers = {};
    (window.matchMedia as unknown) = jest.fn((query: string) => ({
      matches: !!system[query],
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => (handlers[query] = cb),
      removeEventListener: () => {},
    }));
    ['data-contrast', 'data-display-motion', 'data-transparency', 'data-fields'].forEach((a) =>
      root.removeAttribute(a),
    );
    TestBed.resetTestingModule();
  });

  afterAll(() => {
    window.matchMedia = original;
  });

  function service(): DisplaySettingsService {
    const svc = TestBed.inject(DisplaySettingsService);
    svc.init();
    return svc;
  }

  it('follows the system settings and writes every attribute', () => {
    system['(prefers-contrast: more)'] = true;
    const svc = service();
    expect(svc.effective()).toEqual({
      contrast: true,
      motion: false,
      transparency: false,
      fields: false,
    });
    expect(root.getAttribute('data-contrast')).toBe('more');
    expect(root.getAttribute('data-display-motion')).toBe('full');
    expect(root.getAttribute('data-transparency')).toBe('full');
    expect(root.getAttribute('data-fields')).toBe('normal');
    expect(svc.hasChoice()).toBe(false);
  });

  it('follows a live change of the system while there is no choice', () => {
    service();
    handlers['(prefers-reduced-motion: reduce)']({
      matches: true,
    } as MediaQueryListEvent);
    expect(root.getAttribute('data-display-motion')).toBe('reduce');
    expect(reducedMotion()).toBe(true);
    expect(motionReduced()).toBe(true);
  });

  it('lets a choice override the system, also against it, and keeps it in the browser', () => {
    system['(prefers-reduced-motion: reduce)'] = true;
    const svc = service();
    svc.set('motion', false);
    svc.set('fields', true);
    expect(root.getAttribute('data-display-motion')).toBe('full');
    expect(reducedMotion()).toBe(false);
    expect(root.getAttribute('data-fields')).toBe('highlight');
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      motion: false,
      fields: true,
    });
    handlers['(prefers-reduced-motion: reduce)']({
      matches: true,
    } as MediaQueryListEvent);
    expect(root.getAttribute('data-display-motion')).toBe('full');
    expect(svc.hasChoice()).toBe(true);
  });

  it('reads the stored choices after a reload', () => {
    localStorage.setItem(KEY, JSON.stringify({ transparency: true, contrast: 'x' }));
    const svc = service();
    expect(svc.choices()).toEqual({ transparency: true });
    expect(root.getAttribute('data-transparency')).toBe('reduce');
  });

  it('removes every choice on reset', () => {
    system['(prefers-reduced-transparency: reduce)'] = true;
    const svc = service();
    svc.set('transparency', false);
    svc.reset();
    expect(svc.hasChoice()).toBe(false);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(root.getAttribute('data-transparency')).toBe('reduce');
  });

  it('leaves data-motion to the route transitions', () => {
    // `:root[data-motion]` names the rail and the bottom bar for a view transition, and a
    // named element is a backdrop root: the glass over it would no longer blur the page.
    const svc = service();
    svc.set('motion', true);
    expect(root.hasAttribute('data-motion')).toBe(false);
    expect(root.getAttribute('data-display-motion')).toBe('reduce');
  });

  it('ignores a stored value that is no JSON object', () => {
    localStorage.setItem(KEY, 'nope');
    expect(service().choices()).toEqual({});
    localStorage.setItem(KEY, 'null');
    TestBed.resetTestingModule();
    expect(service().choices()).toEqual({});
  });

  it('keeps a choice for the session when the storage is blocked', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const svc = service();
    svc.set('contrast', true);
    expect(root.getAttribute('data-contrast')).toBe('more');
    spy.mockRestore();
  });

  it('follows no system setting without matchMedia', () => {
    (window.matchMedia as unknown) = undefined;
    expect(service().effective().motion).toBe(false);
  });
});
