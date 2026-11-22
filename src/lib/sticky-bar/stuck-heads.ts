import { Injectable, computed, signal } from "@angular/core";

/**
 * How many heads of the page stick under a bar now: the heads of list groups
 * (`ListGroupComponent`, under the search bar of a phone list) and the tab lines
 * (`TabPagerComponent`, under the bar of a detail). The bar above reads it and leaves out its
 * own edge, so only the lowest head carries it (`stb--covered`, `ld__bar--covered`).
 *
 * A selector such as `body:has(.lg__head--stuck) app-sticky-bar` would say the same in
 * CSS, but a class that changes inside `body:has()` makes the browser style the whole
 * page again: 13 ms on a desktop and about 50 ms on a phone for the list of Anträge, in the
 * first frame of each scroll down (app spec 002165). A class on the bar restyles only the
 * bar.
 */
@Injectable({ providedIn: "root" })
export class StuckHeads {
  private readonly groups = signal(0);
  private readonly tabs = signal(0);

  /** A group head sticks under the search bar. */
  readonly groupHead = computed(() => this.groups() > 0);
  /** A tab line sticks under the bar of a detail. */
  readonly tabBar = computed(() => this.tabs() > 0);

  /** A group head became stuck (`true`) or left that state (`false`). */
  group(stuck: boolean): void {
    this.groups.update((n) => Math.max(0, n + (stuck ? 1 : -1)));
  }

  /** A tab line became stuck (`true`) or left that state (`false`). */
  tab(stuck: boolean): void {
    this.tabs.update((n) => Math.max(0, n + (stuck ? 1 : -1)));
  }
}
