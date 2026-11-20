import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  afterNextRender,
  computed,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IconComponent,
  ScrollFadeDirective,
  UiKitTranslatePipe,
  searchShortcutKeys,
} from '@stupa-makers/ui-kit';
import type { NavMarkContext } from '../nav-mark.directive';
import { navGroups, type ShellBrand, type ShellNavItem } from '../shell.types';

/**
 * The navigation rail: 96px at the start edge of every signed-in page above the phone
 * width. The mark leads to the start page. Below it the search entry emits `search`, so the
 * search is in reach on every page also without a keyboard. Then come the `main` entries,
 * a spacer, the `[railTools]` slot (for example a help menu), the `end` entries, the
 * `[railEnd]` slot (for example an `app-rail-button`) and the `[railAccount]` slot at the
 * foot.
 *
 * Entries with a `group` follow the other `main` entries as one entry that opens and
 * closes them (`aria-expanded`). A group is closed at first and opens by itself when one of
 * its entries is the active page.
 *
 * The `main` entries scroll when the rail is too low for them. The rail scrolls the active
 * entry fully into view when the page loads and after each change of the route.
 *
 * The app filters `items` by permission; the rail shows what it gets. `app-shell` renders
 * the rail and fills its slots.
 */
@Component({
  selector: 'app-nav-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgTemplateOutlet,
    UiKitTranslatePipe,
    IconComponent,
    ScrollFadeDirective,
  ],
  templateUrl: './nav-rail.component.html',
  styleUrl: './nav-rail.component.scss',
})
export class NavRailComponent {
  readonly items = input<readonly ShellNavItem[]>([]);
  readonly brand = input.required<ShellBrand>();
  /** Show the search entry. */
  readonly searchable = input(true);
  /** The mark per entry (see `NavMarkDirective`). */
  readonly mark = input<TemplateRef<NavMarkContext> | null>(null);

  /** The search entry was pressed. */
  readonly search = output<void>();

  /** The palette shortcut, for `aria-keyshortcuts`. */
  readonly searchKeys = searchShortcutKeys();

  private readonly injector = inject(Injector);
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');

  readonly mainItems = computed(() => this.items().filter((i) => i.place === 'main' && !i.group));
  readonly groups = computed(() => navGroups(this.items().filter((i) => i.place === 'main')));

  /** The keys of the open groups. */
  private readonly opened = signal<ReadonlySet<string>>(new Set());

  isOpen(key: string): boolean {
    return this.opened().has(key);
  }

  /** Open or close a group; an opened group scrolls its last entry into view. */
  toggle(key: string, sub: HTMLElement): void {
    const open = !this.isOpen(key);
    this.setOpen(key, open);
    if (open) this.reveal(sub);
  }

  /** An entry of a group became the active page: the group opens. */
  activeInGroup(key: string, entry: HTMLElement): void {
    this.setOpen(key, true);
    this.reveal(entry);
  }

  private setOpen(key: string, open: boolean): void {
    const rest = [...this.opened()].filter((k) => k !== key);
    this.opened.set(new Set(open ? [...rest, key] : rest));
  }
  readonly endItems = computed(() => this.items().filter((i) => i.place === 'end'));

  /** The mark of one theme, or `null` when the brand has one image for both. */
  readonly themedMark = computed(() => {
    const mark = this.brand().mark;
    return typeof mark === 'string' ? null : mark;
  });
  readonly plainMark = computed(() => {
    const mark = this.brand().mark;
    return typeof mark === 'string' ? mark : null;
  });

  /**
   * Scroll the list of main entries so that `entry` is fully in view. Runs after the next
   * render, because an entry reports itself as active before the list has its size.
   */
  reveal(entry: HTMLElement): void {
    afterNextRender(
      () => {
        const main = this.main()?.nativeElement;
        if (!main) return;
        const box = main.getBoundingClientRect();
        const item = entry.getBoundingClientRect();
        if (item.top < box.top) main.scrollBy({ top: item.top - box.top });
        else if (item.bottom > box.bottom) main.scrollBy({ top: item.bottom - box.bottom });
      },
      { injector: this.injector },
    );
  }
}
