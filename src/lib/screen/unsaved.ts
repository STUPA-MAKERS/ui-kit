import { Injectable, computed, inject, signal } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';

/** Asks the person whether to leave and lose the changes; resolves `true` to leave. */
export type LeaveAsk = () => Promise<boolean>;

/**
 * The screens with unsaved changes (§S/framework/screens/002242). A form screen holds a place
 * while it has changes, and the route guard `leaveUnsaved` asks through it before a
 * navigation leaves the page. The window asks too (`beforeunload`).
 */
@Injectable({ providedIn: 'root' })
export class UnsavedChanges {
  private readonly asks = signal<readonly LeaveAsk[]>([]);
  readonly dirty = computed(() => this.asks().length > 0);

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeunload', (event) => {
      if (this.dirty()) event.preventDefault();
    });
  }

  /** Hold a place while there are changes; the returned function gives it back. */
  hold(ask: LeaveAsk): () => void {
    this.asks.update((list) => [...list, ask]);
    return () => this.asks.update((list) => list.filter((a) => a !== ask));
  }

  /** Ask each screen with changes in turn; `false` as soon as one says stay. */
  async confirmLeave(): Promise<boolean> {
    return this.asks().reduce<Promise<boolean>>(
      async (prev, ask) => (await prev) && ask(),
      Promise.resolve(true),
    );
  }
}

/** The route guard: a navigation away from unsaved changes asks first. */
export const leaveUnsaved: CanDeactivateFn<unknown> = () => {
  const unsaved = inject(UnsavedChanges);
  return unsaved.dirty() ? unsaved.confirmLeave() : true;
};
