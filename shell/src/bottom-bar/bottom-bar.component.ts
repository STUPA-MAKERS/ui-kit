import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { IconComponent, SideSheetComponent, UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import { filter } from 'rxjs';
import type { NavMarkContext } from '../nav-mark.directive';
import { navGroups, type ShellNavItem } from '../shell.types';
import { ShellMoreSheet } from './more-sheet';

/**
 * The phone navigation (viewport < 768px): the entries of `barKeys`, the `[barEnd]` slot
 * (for example an `app-bar-button`), then "More". "More" opens a bottom sheet in this
 * order: the other entries (with their count mark), the groups of entries (each a row that
 * opens and closes its entries; a group with the active page is open), the search, the `[more]` slot (extra
 * groups, for example a help menu) and the `[moreAccount]` slot (the account menu).
 *
 * With `more` false the bar has no "More" entry; give every entry a key in `barKeys`
 * then. The sheet closes after each navigation, and after a click on a link or a button in
 * the `[more]` slot (an action such as "Report a problem" that opens a dialog, or a link
 * that leaves the app). A click on empty space of the sheet keeps it open, and so does a
 * switch, a check box or a control marked `data-more-keep`. The content of the
 * slot can also close it with `ShellMoreSheet.close()`. "More" is the active entry while
 * the page belongs to one of its entries or starts with one of `morePaths`.
 */
@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    UiKitTranslatePipe,
    IconComponent,
    SideSheetComponent,
  ],
  templateUrl: './bottom-bar.component.html',
  styleUrl: './bottom-bar.component.scss',
})
export class BottomBarComponent {
  private readonly router = inject(Router);

  readonly items = input<readonly ShellNavItem[]>([]);
  /** The keys of the entries in the bar, in bar order. The other entries go into "More". */
  readonly barKeys = input<readonly string[]>([]);
  /** Show the search in "More". */
  readonly searchable = input(true);
  /** Show the "More" entry and its sheet. */
  readonly more = input(true);
  /** Paths outside the entries that also make "More" active, for example `/account`. */
  readonly morePaths = input<readonly string[]>([]);
  /** The mark per entry (see `NavMarkDirective`). */
  readonly mark = input<TemplateRef<NavMarkContext> | null>(null);

  /** The "More" sheet is open. */
  readonly moreOpen = model(false);

  /** The search in "More" was pressed; the sheet is already closed. */
  readonly search = output<void>();

  private readonly url = signal(this.router.url);

  /**
   * The entry that a finger presses, from the press until the navigation ends: its pill
   * shows at once, and the pill of the active entry goes (app spec 002163). Reason: the
   * active mark of the router comes only after the new page has rendered; the pill then
   * started late, and in the frames of the render it moved in jerks or not at all.
   */
  protected readonly going = signal<string | null>(null);
  /** A navigation started since the press. */
  private started = false;

  /** The bar entries, in bar order. */
  readonly barItems = computed<ShellNavItem[]>(() => {
    const visible = this.items().filter((i) => !i.group);
    return this.barKeys()
      .map((key) => visible.find((i) => i.key === key))
      .filter((i): i is ShellNavItem => !!i);
  });

  /** The other entries, in rail order: they go into the "More" sheet. */
  private readonly restItems = computed<ShellNavItem[]>(() => {
    const inBar = this.barItems();
    return this.items().filter((i) => !inBar.includes(i));
  });

  /** The entries of "More" outside a group. */
  readonly moreItems = computed<ShellNavItem[]>(() => this.restItems().filter((i) => !i.group));

  /** The groups of "More", after its other entries; each opens and closes. */
  readonly groups = computed(() => navGroups(this.restItems()));

  /** The groups the person opened (true) or closed (false). */
  private readonly chosen = signal<ReadonlyMap<string, boolean>>(new Map());

  /** A group is open when the person opened it, else while it holds the active page. */
  isOpen(key: string): boolean {
    const choice = this.chosen().get(key);
    if (choice !== undefined) return choice;
    const path = this.url().split(/[?#]/)[0];
    const inside = (base: string): boolean => path === base || path.startsWith(`${base}/`);
    return this.groups().some((g) => g.key === key && g.items.some((i) => inside(i.path)));
  }

  toggle(key: string): void {
    this.chosen.set(new Map(this.chosen()).set(key, !this.isOpen(key)));
  }

  /** "More" is the active entry while the page belongs to one of its entries or paths. */
  readonly moreActive = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const inside = (base: string): boolean => path === base || path.startsWith(`${base}/`);
    return this.morePaths().some(inside) || this.restItems().some((i) => inside(i.path));
  });

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationStart) this.started = true;
      if (
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError ||
        e instanceof NavigationSkipped
      ) {
        this.going.set(null);
      }
    });
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.moreOpen.set(false);
      });
    const unregister = inject(ShellMoreSheet).register(() => this.moreOpen.set(false));
    inject(DestroyRef).onDestroy(unregister);
  }

  /**
   * A click on a link or a button of the `[more]` slot closes the sheet. A switch, a check
   * box and a control marked `data-more-keep` keep it open, because the person sets a
   * value there and may set the next one.
   */
  onSlotClick(event: Event): void {
    const { target, currentTarget } = event;
    if (!(target instanceof Element) || !(currentTarget instanceof Element)) return;
    const hit = target.closest(
      'a[href], button, [role="button"], [role="menuitem"], [role="link"]',
    );
    const keeps = '[role="switch"], [role="checkbox"], [data-more-keep]';
    if (hit && currentTarget.contains(hit) && !hit.matches(':disabled') && !hit.closest(keeps)) {
      this.moreOpen.set(false);
    }
  }

  /** A press on an entry of the bar: its pill shows at once. */
  protected press(key: string, event: PointerEvent): void {
    if (event.button !== 0) return;
    this.started = false;
    this.going.set(key);
  }

  /**
   * The press ended: a tap navigates in the click right after it. When no navigation
   * started (the finger left the entry, the entry is the page already), the pill goes back.
   */
  protected release(): void {
    if (this.going() === null) return;
    setTimeout(() => {
      if (!this.started) this.going.set(null);
    });
  }

  openMore(): void {
    this.moreOpen.set(true);
  }

  closeMore(): void {
    this.moreOpen.set(false);
  }

  onSearch(): void {
    this.moreOpen.set(false);
    this.search.emit();
  }
}
