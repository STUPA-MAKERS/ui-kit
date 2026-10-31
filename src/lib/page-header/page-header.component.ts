import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ListDetailNav, dockInListDetailBar } from '../list-detail/list-detail-nav';

/**
 * The header every page starts with: a crumb trail, the title, a subtitle and the actions.
 *
 * One component owns the whole block, so the crumb trail cannot drift away from the title
 * it belongs to, and a wide page aligns the same way a normal one does.
 *
 * Slots:
 *
 * - `[crumbs]`: the crumb trail of the app (for example its `app-breadcrumbs`). It sits
 *   above the title. A `pane` header and a header below the bar of a one-view page do not
 *   show it.
 * - `[heading]`: a status of the page object (for example "Active" next to the name of a
 *   form). It sits on the baseline of the title, as `meta` does, so it does not float away
 *   from the title on a phone the way an entry of the `actions` slot does.
 * - `[actions]`: the actions of the page, at the end of the title line.
 *
 * ```html
 * <app-page-header [title]="title" [subtitle]="subtitle">
 *   <app-breadcrumbs crumbs />
 *   <app-button actions (click)="add()">…</app-button>
 * </app-page-header>
 * ```
 *
 * Below the bar of a one-view page (`app-list-detail-bar`) the header has no crumb trail:
 * the back arrow of the bar replaces it. The bar shows the actions of the header and the
 * title in small type; the header keeps the title for screen readers only.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[class.ph--flush]': 'flush()',
    '[class.ph--rail]': 'rail()',
    '[class.ph--pane]': 'pane()',
    '[class.ph--display]': 'display()',
  },
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);

  /**
   * A short fact about the page, such as a count ("8 open").
   *
   * The header shows it as muted text on the baseline of the title. Do not put such a
   * text into the `actions` slot: on a phone the slot moves next to or under the title
   * and the text then floats away from the title it belongs to.
   */
  readonly meta = input<string | null>(null);

  /**
   * Drop the bottom margin of the header.
   *
   * Set it when the surrounding layout already spaces its children, for example a flex
   * column with a `gap`. Otherwise the margin and the gap both apply and the band under
   * the title grows to the sum of the two.
   */
  readonly flush = input(false);

  /**
   * Follow a rail layout: cap the header at `--layout-max-width` and centre it.
   *
   * A rail page puts its content in a three-column grid: a rail that breaks out into the
   * margin, a main column capped at `--layout-max-width`, and a matching margin on the
   * other side, so the content is centred. Such a page is also a wide page, which has no
   * cap of its own. Without this flag the header fills the viewport and starts at the
   * gutter, while the content it titles starts at the centred column. Narrow viewports
   * collapse the outer columns to zero, so the offset shows only on a wide screen.
   *
   * Do not set it on a wide page whose content starts at the gutter. There the full-width
   * header is correct.
   */
  readonly rail = input(false);

  /**
   * The header of a list column beside a detail sheet.
   *
   * The pane header is one line at the height of a control: the title inset like the
   * rows, the `heading` slot beside it, the `actions` at the end edge of the column. It
   * has no crumb trail and no bottom margin (the column spaces its children). Every list
   * column uses it, so the columns share one title geometry; a page never styles its
   * list header itself. `--ph-inset` sets the start inset of the title.
   */
  readonly pane = input(false);

  /**
   * Keep the page title size of the wide layout (d2, 28/36) on a phone too, where the
   * title is otherwise h1 (22/28). A greeting at the top of a start page uses it.
   */
  readonly display = input(false);

  /** The id of the title element, for an `aria-labelledby` of the region it names. */
  readonly titleId = input<string | null>(null);

  /**
   * The element of the title. `p` is for a title that is no heading of the page, for
   * example a navigation column beside a page that has its own h1.
   */
  readonly titleTag = input<'h1' | 'p'>('h1');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly nav = inject(ListDetailNav, { optional: true });
  private readonly actions = viewChild.required<TemplateRef<unknown>>('actions');
  private readonly facts = viewChild.required<TemplateRef<unknown>>('facts');

  /** The header is on a page below the bar of a one-view page. */
  protected readonly underBar = computed(() => !!this.nav?.active());

  /**
   * The bar of the one-view page shows the actions of this header. The meta and the
   * heading slot go into the bar too, as the second line under the small title, so they
   * do not hang below the bar without the title they belong to.
   */
  protected readonly docked = dockInListDetailBar({
    actions: this.actions,
    titled: () => !this.pane(),
    title: () => this.host.nativeElement.querySelector('.ph__title'),
    subtitle: this.facts,
  });

  /**
   * A title that changes after the first render reaches the bar at once, not only on the
   * next scroll.
   */
  constructor() {
    effect(() => {
      const title = this.title();
      if (this.docked()) this.nav?.title.set(title);
    });
  }
}
