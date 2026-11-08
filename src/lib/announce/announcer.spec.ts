import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANNOUNCE_DELAY_MS, Announcer } from './announcer';

describe('Announcer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  const region = (politeness: string): HTMLElement =>
    document.querySelector(`[data-announcer="${politeness}"]`) as HTMLElement;

  it('puts both live regions into the body before the first message', () => {
    TestBed.inject(Announcer);
    expect(region('polite').getAttribute('aria-live')).toBe('polite');
    expect(region('assertive').getAttribute('aria-live')).toBe('assertive');
    expect(region('polite')).toHaveClass('sr-only');
    expect(region('polite').textContent).toBe('');
  });

  it('writes the message after a short pause, so the same text twice is read twice', () => {
    const announcer = TestBed.inject(Announcer);
    announcer.announce('Gespeichert');
    expect(region('polite').textContent).toBe('');
    jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(region('polite').textContent).toBe('Gespeichert');
    announcer.announce('Gespeichert');
    expect(region('polite').textContent).toBe('');
    jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(region('polite').textContent).toBe('Gespeichert');
  });

  it('uses the assertive region for a fault, ignores an empty message and clears', () => {
    const announcer = TestBed.inject(Announcer);
    announcer.announce('Fehler', 'assertive');
    announcer.announce('   ');
    jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(region('assertive').textContent).toBe('Fehler');
    expect(region('polite').textContent).toBe('');
    announcer.clear();
    expect(region('assertive').textContent).toBe('');
  });

  it('puts a region back when the page removed it', () => {
    const announcer = TestBed.inject(Announcer);
    document.body.innerHTML = '';
    announcer.announce('Neu');
    jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
    expect(region('polite').textContent).toBe('Neu');
  });

  it('stays silent in a document without a body', () => {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { body: null } }] });
    const announcer = TestBed.inject(Announcer);
    expect(() => {
      announcer.announce('Neu');
      jest.advanceTimersByTime(ANNOUNCE_DELAY_MS);
      announcer.clear();
    }).not.toThrow();
  });
});
