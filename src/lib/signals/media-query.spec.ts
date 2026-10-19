import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MEDIA } from '../breakpoints/breakpoints';
import { matchesMedia, mediaQuery } from './media-query';

@Component({ selector: 'app-media-host', standalone: true, template: '' })
class Host {
  readonly phone = mediaQuery(MEDIA.phone);
}

describe('mediaQuery', () => {
  const original = window.matchMedia;
  let listener: ((e: MediaQueryListEvent) => void) | null = null;
  const remove = jest.fn();

  beforeEach(() => {
    listener = null;
    remove.mockReset();
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => (listener = cb),
      removeEventListener: remove,
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => (window.matchMedia = original));

  it('starts with the current match and follows the changes', () => {
    const fixture = TestBed.createComponent(Host);
    expect(fixture.componentInstance.phone()).toBe(true);
    listener?.({ matches: false } as MediaQueryListEvent);
    expect(fixture.componentInstance.phone()).toBe(false);
  });

  it('removes its listener with the component', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('change', listener);
  });

  it('reads one match, and is false without matchMedia', () => {
    expect(matchesMedia(MEDIA.coarse)).toBe(true);
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    expect(matchesMedia(MEDIA.reducedMotion)).toBe(false);
    const fixture = TestBed.createComponent(Host);
    expect(fixture.componentInstance.phone()).toBe(false);
    fixture.destroy();
  });
});
