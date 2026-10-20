import {
  DestroyRef,
  Injectable,
  Signal,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';

/** A sheet bar that hands its actions to the bar of the list/detail layout. */
export interface ListDetailBarClient {
  /** The actions of the sheet bar (icon buttons, the row menu). */
  readonly actions: TemplateRef<unknown>;
}

/**
 * The link between `app-list-detail` and the `app-sheet-bar` of its detail, one per layout.
 *
 * One view at a time, the layout shows a bar (`app-list-detail-bar`) at the top of the
 * detail: the way back to the list, the title in small type once the big title has scrolled under the bar, and
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

/** What a header hands to `dockInListDetailBar`. */
export interface ListDetailDockOptions {
  /** The template of the header actions. */
  readonly actions: () => TemplateRef<unknown>;
  /** The header has a big title, so it takes part. A header without one keeps its actions. */
  readonly titled: () => boolean;
  /** The element of the big title, read on scroll. */
  readonly title: () => Element | null;
}

/**
 * Hands the actions of a header to the bar of the one-view layout (`ListDetailNav`) and
 * reports the big title of the header to it: the bar shows the title in small type once
 * the big title has scrolled under the bar. Call it in the constructor of the header. It
 * returns true while the bar shows the actions, so the header hides its own. Without a
 * `ListDetailNav` above the header it is always false. The text of the title goes to
 * `ListDetailNav.title`, so a bar with a fixed title (`[title]`) can show it compact.
 *
 * `app-sheet-bar` uses it for a detail sheet; a page header (the administration) can use
 * it the same way.
 */
export function dockInListDetailBar(options: ListDetailDockOptions): Signal<boolean> {
  const nav = inject(ListDetailNav, { optional: true });
  const client = signal<ListDetailBarClient | null>(null);
  const docked = computed(
    () => !!nav?.active() && client() !== null && nav.owner() === client(),
  );
  if (!nav) return docked;

  // A header with a title registers once its actions template exists.
  effect(() => {
    const actions = options.actions();
    const titled = options.titled();
    untracked(() => {
      const current = client();
      if (titled && !current) {
        const next = { actions };
        client.set(next);
        nav.register(next);
      } else if (!titled && current) {
        nav.unregister(current);
        client.set(null);
      }
    });
  });

  const check = () => {
    if (!docked()) return;
    const title = options.title();
    if (!title) return;
    nav.title.set(title.textContent?.trim() ?? '');
    nav.condensed.set(title.getBoundingClientRect().bottom <= nav.barBottom());
  };
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      check();
    });
  };
  effect(() => {
    if (docked()) requestAnimationFrame(check);
  });
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  inject(DestroyRef).onDestroy(() => {
    window.removeEventListener('scroll', onScroll, { capture: true });
    if (frame) cancelAnimationFrame(frame);
    const current = client();
    if (current) nav.unregister(current);
  });
  return docked;
}
