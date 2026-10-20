import { Injectable, TemplateRef, computed, signal } from '@angular/core';

/** A sheet bar that hands its actions to the bar of the list/detail layout. */
export interface ListDetailBarClient {
  /** The actions of the sheet bar (icon buttons, the row menu). */
  readonly actions: TemplateRef<unknown>;
}

/**
 * The link between `app-list-detail` and the `app-sheet-bar` of its detail, one per layout.
 *
 * One view at a time, the layout shows a bar at the top of the detail: the way back to
 * the list, the title in small type once the big title has scrolled under the bar, and
 * the actions of the sheet. The bar stays at the top while the page scrolls. The actions
 * belong to the sheet bar of the detail, so that bar registers here and the layout
 * renders them in its own bar; the big title stays in the sheet.
 *
 * The first registered bar owns the place. A detail that is swapped for the next one can
 * register its new bar before the old bar is gone, and a bar in a dialog of the detail
 * comes later than the bar of the sheet; both cases keep the right owner.
 */
@Injectable()
export class ListDetailNav {
  /** The layout shows its bar: one view at a time, with a way back. */
  readonly active = signal(false);
  /** The big title has scrolled under the bar, so the bar shows the small title. */
  readonly condensed = signal(false);
  /** The text of the small title. */
  readonly title = signal('');
  /** The lower edge of the bar in the viewport, in px; 0 while no bar shows. */
  barBottom: () => number = () => 0;

  private readonly clients = signal<readonly ListDetailBarClient[]>([]);

  /** The sheet bar whose actions the layout shows, if any. */
  readonly owner = computed(() => this.clients()[0] ?? null);

  register(client: ListDetailBarClient): void {
    this.clients.update((list) => [...list, client]);
  }

  unregister(client: ListDetailBarClient): void {
    const wasOwner = this.owner() === client;
    this.clients.update((list) => list.filter((c) => c !== client));
    if (wasOwner) {
      this.condensed.set(false);
      this.title.set('');
    }
  }
}
