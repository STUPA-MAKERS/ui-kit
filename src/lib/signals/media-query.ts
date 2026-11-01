import { DestroyRef, type Signal, inject, signal } from '@angular/core';

function matchList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(query);
}

/**
 * Whether a CSS media query matches now, for example `MEDIA.coarse`. False where the
 * browser has no `matchMedia` (a test, a server render).
 */
export function matchesMedia(query: string): boolean {
  return matchList(query)?.matches ?? false;
}

/**
 * A signal that follows a CSS media query, for example `MEDIA.phone`. Call it in an
 * injection context (a constructor or a field initializer); the listener goes away with
 * the injector. Without `matchMedia` the signal stays false.
 */
export function mediaQuery(query: string): Signal<boolean> {
  const media = matchList(query);
  const state = signal(media?.matches ?? false);
  if (media) {
    const onChange = (event: MediaQueryListEvent): void => state.set(event.matches);
    media.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onChange));
  }
  return state.asReadonly();
}
