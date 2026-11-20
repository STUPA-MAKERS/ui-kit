import { DestroyRef, Injectable, Injector, afterNextRender, inject } from '@angular/core';
import {
  type ActivatedRouteSnapshot,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';

/** How long the focus waits for the heading of a page that loads its data. */
export const ROUTE_FOCUS_WAIT_MS = 3000;

/**
 * Moves the focus to the heading of the new page after a navigation (WCAG 2.4.3), so a
 * screen reader announces the page and the next Tab starts at its top.
 *
 * `app-shell` starts it with its `main`. After a navigation to another path, it waits until
 * the heading shows and focuses it:
 * - the first `h1` or `h2` of the {@link scope} (the detail pane of a list), while one is set
 *   and shows;
 * - else the first `h1` of `main`.
 * A page that loads its data first shows its heading later, so it waits up to
 * {@link ROUTE_FOCUS_WAIT_MS}, then it focuses the scope or `main` itself.
 *
 * It leaves the focus where it is:
 * - on the first page of the app (the browser starts there);
 * - when only the query or the fragment changes (a filter that writes the URL keeps the
 *   focus in its field);
 * - on a route with the data `routeFocus: false`;
 * - when something else moved the focus after the navigation (a field with autofocus, a
 *   dialog); the scope itself holding the focus does not count;
 * - when a component calls {@link hold} for this navigation, because it moves the focus
 *   itself (the list returns the focus to its row when the detail closes).
 *
 * A heading gets `tabindex="-1"` so it can take the focus, and `base.scss` draws no ring
 * on it: it is no control.
 */
@Injectable({ providedIn: 'root' })
export class RouteFocus {
  private readonly router = inject(Router);

  private readonly injector = inject(Injector);

  /** Gives the pane whose heading takes the focus, for example the open detail of a list. */
  private scopeFn: ScopeFn | null = null;
  private held = false;
  private started = false;
  /** The path of the last navigation, `null` before the first one. */
  private path: string | null = null;
  /** Counts the navigations, so a slow seek stops when a newer navigation runs. */
  private run = 0;

  /**
   * Sets the function that gives the pane whose heading takes the focus. It is read after
   * the render, and `null` from it means the page.
   */
  setScope(scope: ScopeFn): void {
    this.scopeFn = scope;
  }

  /** Clears the scope, if it is still this one. */
  releaseScope(scope: ScopeFn): void {
    if (this.scopeFn === scope) this.scopeFn = null;
  }

  /** The caller moves the focus for the current navigation itself. */
  hold(): void {
    this.held = true;
  }

  /**
   * Watches the navigations for the life of the caller (call it in an injection context).
   * `main` gives the main element of the frame. It starts once; a second call does nothing.
   */
  start(main: () => HTMLElement | undefined): void {
    if (this.started) return;
    this.started = true;
    const sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.held = false;
        return;
      }
      if (!(e instanceof NavigationEnd)) return;
      const next = pathOf(e.urlAfterRedirects);
      const changed = this.path !== null && next !== this.path;
      this.path = next;
      if (!changed || !this.wanted()) return;
      const token = ++this.run;
      const before = document.activeElement;
      const deadline = Date.now() + ROUTE_FOCUS_WAIT_MS;
      const seek = (): void => {
        if (token !== this.run || this.held || this.moved(before)) return;
        const target = this.target(main());
        if (target) {
          focusQuietly(target);
          return;
        }
        if (Date.now() > deadline) {
          const fallback = this.visibleScope() ?? main();
          if (fallback) focusQuietly(fallback);
          return;
        }
        requestAnimationFrame(seek);
      };
      afterNextRender(seek, { injector: this.injector });
    });
    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      this.started = false;
      this.path = null;
    });
  }

  /** No route of the active chain has `routeFocus: false`. */
  private wanted(): boolean {
    return !routeChain(this.router.routerState.snapshot.root).some(
      (r) => r.data['routeFocus'] === false,
    );
  }

  private visibleScope(): HTMLElement | null {
    const scope = this.scopeFn?.() ?? null;
    return scope?.isConnected && shows(scope) ? scope : null;
  }

  /** Something other than the scope took the focus after the navigation. */
  private moved(before: Element | null): boolean {
    const active = document.activeElement;
    return (
      active !== null &&
      active !== document.body &&
      active !== before &&
      active.isConnected &&
      active !== this.visibleScope()
    );
  }

  /** The heading to focus, or null while it does not show yet. */
  private target(main: HTMLElement | undefined): HTMLElement | null {
    const scope = this.visibleScope();
    if (scope) return firstShown(scope, 'h1, h2');
    return main ? firstShown(main, 'h1') : null;
  }
}

/** Gives the pane whose heading takes the focus, or `null`. */
export type ScopeFn = () => HTMLElement | null;

/** The path of a router URL, without the query and the fragment. */
function pathOf(url: string): string {
  return url.split(/[?#]/)[0];
}

/** The element has a box (a `sr-only` heading has one too). */
function shows(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && !el.closest('[hidden], [inert]');
}

function firstShown(root: HTMLElement, selector: string): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>(selector)).find((h) => shows(h)) ?? null
  );
}

/** Focuses without a scroll; an element that is no control gets `tabindex="-1"` first. */
function focusQuietly(el: HTMLElement): void {
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

function routeChain(route: ActivatedRouteSnapshot | null): readonly ActivatedRouteSnapshot[] {
  return route ? [route, ...routeChain(route.firstChild)] : [];
}
