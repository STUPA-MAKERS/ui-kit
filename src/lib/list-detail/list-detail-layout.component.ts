import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { BREAKPOINTS, MEDIA } from '../breakpoints/breakpoints';
import { mediaQuery } from '../signals/media-query';
import { observeElementSize } from '../signals/element-size';
import { ListDetailNav } from './list-detail-nav';
import { ListDetailBarComponent } from './list-detail-bar.component';
import { SwipeBackDirective } from '../swipe-back/swipe-back.directive';

/** The width of the navigation rail of the shell, in px. */
export const NAV_RAIL_WIDTH = 96;

/**
 * The page gutter on one side of the content, in px: `--layout-gutter` (`--space-5`,
 * 1.5rem at a 16px root font size). The `.page-shell` box has it on the left and on the
 * right.
 */
export const LAYOUT_GUTTER = 24;

/**
 * The narrowest CONTENT width that shows the list and the detail side by side, in px.
 *
 * The value is the content box that the first wide viewport (`BREAKPOINTS.wideMin`,
 * 1200px) leaves in the shell: the viewport minus the navigation rail and minus the two
 * page gutters (1200 - 96 - 2 * 24 = 1056).
 *
 * The layout splits only when two conditions are true: the viewport is wide
 * (`MEDIA.wide`), and the host is at least this wide. The viewport class makes the switch
 * occur exactly at the wide breakpoint, whatever the shell adds or removes around the
 * content. The measured width collapses the layout when it is in a pane that is too
 * narrow for two panes.
 */
export const LIST_DETAIL_SPLIT_MIN = BREAKPOINTS.wideMin - NAV_RAIL_WIDTH - 2 * LAYOUT_GUTTER;

/**
 * A list with a detail sheet beside it, as on the applications page.
 *
 * Wide (a wide viewport and content of {@link LIST_DETAIL_SPLIT_MIN} or more): the list on
 * the left at the one list width of the app (`--ld-list-width` in `styles/list-detail.scss`), the detail
 * sheet fills the rest. Otherwise one view at a time. The list shows until `detailOpen` is set; then the
 * detail shows below a bar that stays at the top while the page scrolls. The bar holds the
 * back arrow ("Zur Liste", emits `back`), the title in small type once the big title of the
 * sheet has scrolled under the bar, and the actions of the sheet bar of the detail
 * (`ListDetailNav`). The list stays in the DOM while hidden, so it keeps its scroll position.
 *
 * Focus in the one-view layout: when a row opens, the list hides, so the layout moves the
 * focus to the back arrow. When the detail closes, the focus goes back to the element in the
 * list that had it (normally the row), if that element is still in the DOM, else to the
 * list itself. A keyboard or screen-reader user so stays at the same place in the list.
 *
 * Swipe back (a phone with a touch screen, one view at a time, a detail open): a swipe from
 * the left screen edge moves the detail with the finger, and the list comes out under it
 * (`SwipeBackDirective`). A swipe that goes back emits `back`, the same output as the
 * back arrow, so the page closes the detail in its own way. The list shows under the
 * detail at the top of the page, because the navigation back scrolls the page to the
 * top (the router restores the scroll only on a history step).
 *
 * Slots: `[list]` and `[detail]`. In the wide layout with no detail open the page puts its
 * own empty state into the detail slot.
 */
@Component({
  selector: 'app-list-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListDetailBarComponent, SwipeBackDirective],
  providers: [ListDetailNav],
  host: {
    '[class.ld--split]': '!collapsed()',
    '[class.ld--collapsed]': 'collapsed()',
    '[class.ld--swiping]': 'swiping()',
  },
  templateUrl: './list-detail-layout.component.html',
  styleUrl: './list-detail-layout.component.scss',
})
export class ListDetailLayoutComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** The link to the sheet bar of the detail: its actions and its title. */
  protected readonly nav = inject(ListDetailNav);

  /** A row is open, so the narrow layout shows the detail. */
  readonly detailOpen = input(false);
  /**
   * Show the bar with "Zur Liste" above the detail in the one-view layout. A detail with
   * its own way back (the phone header of a vote) turns it off; the focus then goes to the
   * detail, and its sheet bar keeps its actions.
   */
  readonly backButton = input(true);
  /** The content width from which the panes sit side by side. */
  readonly splitMin = input(LIST_DETAIL_SPLIT_MIN);

  /** "Zur Liste" was pressed (narrow layout). The page clears its selection. */
  readonly back = output<void>();

  /** The viewport is in the wide class (`MEDIA.wide`). */
  private readonly viewportWide = mediaQuery(MEDIA.wide);
  /** The measured width of the host. 0 means "not laid out yet" (hidden, or a test). */
  private readonly width = signal(0);

  private readonly listPane = viewChild.required<ElementRef<HTMLElement>>('listPane');
  private readonly detailPane = viewChild.required<ElementRef<HTMLElement>>('detailPane');
  private readonly bar = viewChild(ListDetailBarComponent);
  /** The element in the list that had the focus when the detail opened. */
  private returnFocus: HTMLElement | null = null;

  /** A swipe back runs: the list shows under the detail. */
  protected readonly swiping = signal(false);

  /** True while the viewport or the content is too narrow for two panes. */
  readonly collapsed = computed(() => {
    if (!this.viewportWide()) return true;
    const width = this.width();
    return width > 0 && width < this.splitMin();
  });

  constructor() {
    this.manageFocus();
    effect(() => this.nav.active.set(this.collapsed() && this.backButton()));

    observeElementSize(
      () => this.host.nativeElement,
      (size) => this.width.set(size.width),
    );
  }

  /**
   * The swipe took the move. The list goes under the detail, with its top where the top of
   * the page is when the window is not scrolled: the list is absolute in this host, so it
   * moves down by the scroll of the window.
   */
  protected onSwipeStart(): void {
    this.listPane().nativeElement.style.top = `${window.scrollY}px`;
    this.swiping.set(true);
  }

  /**
   * The detail is out. The window goes to the top first, with the list, so the page that
   * shows after the back looks as the list under the detail did.
   */
  protected onSwipeBack(): void {
    this.listPane().nativeElement.style.top = '0px';
    window.scrollTo(0, 0);
    this.back.emit();
  }

  protected onSwipeEnd(): void {
    this.listPane().nativeElement.style.removeProperty('top');
    this.swiping.set(false);
  }

  /**
   * Moves the focus when the one-view layout changes between the list and the detail.
   * Only a change of `detailOpen` moves it, not the first render (a deep link to a row)
   * and not a change of the layout width.
   */
  private manageFocus(): void {
    const injector = inject(Injector);
    let wasOpen: boolean | null = null;
    effect(() => {
      const open = this.detailOpen();
      const collapsed = this.collapsed();
      untracked(() => {
        const changed = wasOpen !== null && open !== wasOpen;
        wasOpen = open;
        if (!changed || !collapsed) return;
        if (open) {
          // Read before the list hides: then the focused row is still the active element.
          const active = document.activeElement;
          this.returnFocus =
            active instanceof HTMLElement && this.listPane().nativeElement.contains(active)
              ? active
              : null;
          afterNextRender(
            () => {
              if (this.returnFocus !== null || focusIsLost(null)) {
                const bar = this.bar();
                if (bar) bar.focus();
                else this.detailPane().nativeElement.focus();
              }
            },
            { injector },
          );
        } else {
          afterNextRender(
            () => {
              const target = this.returnFocus;
              this.returnFocus = null;
              if (!focusIsLost(this.detailPane().nativeElement)) return;
              // The row that opened the detail, else (a deep link, or the row is gone) the
              // list itself, so that Tab goes on from the list.
              if (target?.isConnected) target.focus();
              else this.listPane().nativeElement.focus();
            },
            { injector },
          );
        }
      });
    });
  }
}

/**
 * True when no visible element has the focus: the focus is on the body, or on an element
 * in `hiddenPane` (a pane that the layout just hid).
 */
function focusIsLost(hiddenPane: HTMLElement | null): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || !!hiddenPane?.contains(active);
}
