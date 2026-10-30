import { DestroyRef, type Signal, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { type ListDetailLayoutComponent, PageFrame } from '@stupa-makers/ui-kit';
import { filter } from 'rxjs';

/** The state a list page with a detail outlet (`app-list-detail`) shares with its panes. */
export interface ListDetailPage {
  /** The id of the open child route, `null` while no row is open. */
  readonly selectedId: Signal<string | null>;
  /** The list and the detail sit side by side. */
  readonly split: Signal<boolean>;
}

/** Options of {@link injectListDetailPage}. */
export interface ListDetailPageOptions {
  /** The route parameter of the child route that holds the id. Default `id`. */
  readonly param?: string;
}

/**
 * Wires a list page to its `app-list-detail` (call it in an injection context). It reads
 * the id of the open row from the child route after every navigation, and sets
 * `PageFrame.fill` while the panes sit side by side, so only the panes scroll. It clears
 * `fill` when the page goes.
 */
export function injectListDetailPage(
  layout: Signal<ListDetailLayoutComponent | undefined>,
  options: ListDetailPageOptions = {},
): ListDetailPage {
  const param = options.param ?? 'id';
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  const frame = inject(PageFrame);

  const selectedId = signal<string | null>(null);
  const read = (): void => selectedId.set(route.snapshot.firstChild?.paramMap.get(param) ?? null);
  read();
  router.events
    .pipe(
      filter((e) => e instanceof NavigationEnd),
      takeUntilDestroyed(),
    )
    .subscribe(read);

  const split = computed(() => layout()?.collapsed() === false);
  effect(() => frame.fill.set(split()));
  inject(DestroyRef).onDestroy(() => frame.fill.set(false));

  return { selectedId: selectedId.asReadonly(), split };
}
