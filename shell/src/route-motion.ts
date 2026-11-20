import { inject } from '@angular/core';
import {
  Router,
  type ActivatedRouteSnapshot,
  type RouterFeatures,
  type ViewTransitionInfo,
  withViewTransitions,
} from '@angular/router';
import { MEDIA, matchesMedia, reducedMotion, settlePressLayers, takeGestureNavigation } from '@stupa-makers/ui-kit';

type NavigateEvent = Event & { readonly hasUAVisualTransition?: boolean };
type NavigationApi = EventTarget;

/** A back or forward gesture that the browser animated counts for this long, in ms. */
const UA_TRANSITION_MS = 1000;
let uaTransitionAt = -Infinity;

/**
 * Note each history navigation that the browser animated itself, for example the back
 * gesture of Android, which slides a screenshot of the whole page (bottom bar included)
 * and which no page can change. The route transition must not run a second time on top,
 * so `onRouteViewTransition` skips the next one. Without the Navigation API nothing is
 * noted. Call it once at app start.
 */
export function watchUAVisualTransitions(win: Window = window): void {
  const nav = (win as Window & { navigation?: NavigationApi }).navigation;
  nav?.addEventListener('navigate', (e) => {
    if ((e as NavigateEvent).hasUAVisualTransition) uaTransitionAt = performance.now();
  });
}

/** True once after a navigation that the browser animated, see `watchUAVisualTransitions`. */
function takeUATransition(): boolean {
  const recent = performance.now() - uaTransitionAt < UA_TRANSITION_MS;
  uaTransitionAt = -Infinity;
  return recent;
}

/**
 * The motion of a navigation.
 * - `push` / `pop`: on a phone, one level deeper or back in the same section. The new
 *   page slides in from the end, or the old one slides out to it.
 * - `none`: everything else. No transition, so a list does not blink when a row opens.
 *
 * A switch to another top-level section (the bottom bar, the rail) is `none` too: the new
 * section shows at once, like a tab bar of a native app (app spec 002162). Reason: a view
 * transition holds the old picture until the new page has rendered, and then starts its
 * fade while the new page is still busy, so the switch froze and then faded in jerks.
 *
 * A navigation that replaces the history entry (`replaceUrl`) is never a push or a pop:
 * it is no step forward or back, but the page that completes its own address, for
 * example a list that opens its default entry. A slide there would move the page a
 * second time.
 */
export type RouteMotion = 'push' | 'pop' | 'none';

/** The path segments of a route tree, from the root to the leaf. */
export function routePath(snapshot: ActivatedRouteSnapshot | null): readonly string[] {
  return snapshot ? [...snapshot.url.map((u) => u.path), ...routePath(snapshot.firstChild)] : [];
}

function startsWith(long: readonly string[], short: readonly string[]): boolean {
  return long.length > short.length && short.every((p, i) => long[i] === p);
}

/** The {@link RouteMotion} of a navigation from one path to another. */
export function routeMotion(
  from: readonly string[],
  to: readonly string[],
  phone: boolean,
  replace = false,
): RouteMotion {
  if ((from[0] ?? '') !== (to[0] ?? '') || !phone || replace) return 'none';
  if (startsWith(to, from)) return 'push';
  if (startsWith(from, to)) return 'pop';
  return 'none';
}

/**
 * The `onViewTransitionCreated` hook of the router, which runs it in an injection
 * context. It skips the transitions that must not show, and names the kind on
 * `<html data-motion>` for the rules in the kit's `motion.scss`. A navigation that a
 * gesture started (the swipe back of the list/detail layout) has no transition, because
 * the finger already moved the page out; a pop on top would slide the list out a second
 * time. The same holds for a back or forward that the browser animated
 * (`watchUAVisualTransitions`).
 */
export function onRouteViewTransition({ transition, from, to }: ViewTransitionInfo): void {
  const phone = matchesMedia(MEDIA.phone);
  const gesture = takeGestureNavigation() || takeUATransition();
  const replace = inject(Router).currentNavigation()?.extras.replaceUrl === true;
  const kind =
    reducedMotion() || gesture
      ? 'none'
      : routeMotion(routePath(from), routePath(to), phone, replace);
  if (kind === 'none') {
    transition.skipTransition();
    return;
  }
  // The page stands still until the new page has rendered; a ripple would stand still in
  // the middle of its growth, so it shows its end (app spec 002164).
  settlePressLayers(document);
  const root = document.documentElement;
  root.dataset['motion'] = kind;
  void transition.finished.finally(() => {
    if (root.dataset['motion'] === kind) delete root.dataset['motion'];
  });
}

/**
 * The router feature of the route motion: view transitions without one on the first
 * navigation, named by {@link onRouteViewTransition}. Also call
 * {@link watchUAVisualTransitions} once at app start.
 *
 * ```ts
 * provideRouter(routes, provideRouteMotion())
 * ```
 */
export function provideRouteMotion(): RouterFeatures {
  return withViewTransitions({
    skipInitialTransition: true,
    onViewTransitionCreated: onRouteViewTransition,
  });
}
