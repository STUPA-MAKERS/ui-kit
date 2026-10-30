import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, SideSheetComponent, UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import { filter } from 'rxjs';
import type { NavMarkContext } from '../nav-mark.directive';
import type { ShellNavItem } from '../shell.types';

/**
 * The phone navigation (viewport <= 768px): the entries of `barKeys`, the `[barEnd]` slot
 * (for example an `app-bar-button`), then "More". "More" opens a bottom sheet in this
 * order: the other entries (with their count mark), the search, the `[more]` slot (extra
 * groups, for example a help menu) and the `[moreAccount]` slot (the account menu).
 *
 * With `more` false the bar has no "More" entry; give every entry a key in `barKeys`
 * then. The sheet closes after each navigation. "More" is the active entry while the page
 * belongs to one of its entries or starts with one of `morePaths`.
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

  /** The bar entries, in bar order. */
  readonly barItems = computed<ShellNavItem[]>(() => {
    const visible = this.items();
    return this.barKeys()
      .map((key) => visible.find((i) => i.key === key))
      .filter((i): i is ShellNavItem => !!i);
  });

  /** The other entries, in rail order: they go into the "More" sheet. */
  readonly moreItems = computed<ShellNavItem[]>(() => {
    const keys = this.barKeys();
    return this.items().filter((i) => !keys.includes(i.key));
  });

  /** "More" is the active entry while the page belongs to one of its entries or paths. */
  readonly moreActive = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const inside = (base: string): boolean => path === base || path.startsWith(`${base}/`);
    return this.morePaths().some(inside) || this.moreItems().some((i) => inside(i.path));
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.moreOpen.set(false);
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
