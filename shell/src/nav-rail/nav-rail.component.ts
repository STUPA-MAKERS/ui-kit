import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IconComponent,
  ScrollFadeDirective,
  UiKitTranslatePipe,
  searchShortcutKeys,
} from '@stupa-makers/ui-kit';
import type { NavMarkContext } from '../nav-mark.directive';
import type { ShellBrand, ShellNavItem } from '../shell.types';

/**
 * The navigation rail: 96px at the start edge of every signed-in page above the phone
 * width. The mark leads to the start page. Below it the search entry emits `search`, so the
 * search is in reach on every page also without a keyboard. Then come the `main` entries,
 * a spacer, the `[railTools]` slot (for example a help menu), the `end` entries, the
 * `[railEnd]` slot (for example an `app-rail-button`) and the `[railAccount]` slot at the
 * foot.
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

  readonly mainItems = computed(() => this.items().filter((i) => i.place === 'main'));
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
}
