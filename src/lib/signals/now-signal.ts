import { DestroyRef, type Signal, effect, inject, signal, untracked } from '@angular/core';

/**
 * A clock: `Date.now()`, refreshed every `periodMs`. Call it in an injection context;
 * the timer stops with the caller.
 *
 * With `active`, the clock ticks only while `active()` is true, for a countdown that
 * matters in one state of the page. It reads the time again when it starts, so the
 * first value is not stale.
 */
export function nowSignal(periodMs = 1000, active?: () => boolean): Signal<number> {
  const now = signal(Date.now());
  let id: ReturnType<typeof setInterval> | null = null;
  const start = (): void => {
    if (id !== null) return;
    now.set(Date.now());
    id = setInterval(() => now.set(Date.now()), periodMs);
  };
  const stop = (): void => {
    if (id !== null) clearInterval(id);
    id = null;
  };
  if (active) {
    effect(() => {
      const on = active();
      untracked(() => (on ? start() : stop()));
    });
  } else {
    start();
  }
  inject(DestroyRef).onDestroy(stop);
  return now.asReadonly();
}
