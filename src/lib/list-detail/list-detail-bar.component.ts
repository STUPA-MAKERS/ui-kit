import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { UiKitTranslatePipe } from '../intl/translate.pipe';
import { ListDetailNav } from './list-detail-nav';

/**
 * The bar at the top of a detail that fills the screen, one view at a time: the back
 * arrow (emits `back`), the title in small type once the big title of the sheet has
 * scrolled under the bar, and the actions of the sheet bar of the detail. It stays at the
 * top while the page (or the scrolling panel around it) scrolls.
 *
 * While a task takes over the detail (`ListDetailNav.task`, such as an edit form), the
 * bar shows an X that cancels the task and the name of the task as a fixed title, and no
 * actions.
 *
 * `app-list-detail` shows it above its detail. A detail outside that layout (the card
 * drawer of a to-do board on a phone) gets the same bar with `appListDetailNav` on its
 * panel and this bar as the first child of the panel: its `app-sheet-bar` then hands its
 * actions to the bar and its title slides into it, as in the layout.
 *
 * The bar pulls into the top padding of its panel (`--main-pad-top`) and over the side
 * gutter (`--layout-gutter`, 16px on a phone), so a panel with other paddings sets the two
 * properties.
 */
@Component({
  selector: 'app-list-detail-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet, UiKitTranslatePipe],
  host: {
    class: 'ld__bar',
    '[class.ld__bar--condensed]': 'nav.condensed() || title() !== null || nav.task() !== null',
    '[class.ld__bar--under]': 'under()',
  },
  templateUrl: './list-detail-bar.component.html',
  styleUrl: './list-detail-bar.component.scss',
})
export class ListDetailBarComponent {
  protected readonly nav = inject(ListDetailNav);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly backButton = viewChild<ElementRef<HTMLButtonElement>>('backButton');

  /** The name of the back arrow; "Zur Liste" by default. */
  readonly label = input<string | null>(null);

  /**
   * A fixed title: the bar shows it compact from the start, for a page without a big
   * title below (the wizard "Antrag stellen"). The page keeps its heading for screen
   * readers, because the title in the bar is hidden from them.
   */
  readonly title = input<string | null>(null);

  /** The back arrow was pressed. */
  readonly back = output<void>();

  /**
   * The page or a panel around the bar has scrolled, so content runs under the bar: only
   * then is the bar glass (`ld__bar--under`). At rest the glass would blur the content
   * below the bar into it.
   */
  protected readonly under = signal(false);

  constructor() {
    this.nav.barBottom = () => this.host.getBoundingClientRect().bottom;
    let frame = 0;
    const check = () => {
      frame = 0;
      this.under.set(scrolledAround(this.host));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    frame = requestAnimationFrame(check);
    inject(DestroyRef).onDestroy(() => {
      this.nav.barBottom = () => 0;
      window.removeEventListener('scroll', onScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    });
  }

  /** Put the focus on the back arrow. */
  focus(): void {
    this.backButton()?.nativeElement.focus();
  }
}

/** The document or an element around `el` has scrolled away from its top. */
function scrolledAround(el: HTMLElement): boolean {
  if ((document.scrollingElement?.scrollTop ?? window.scrollY) > 0) return true;
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.scrollTop > 0) return true;
  }
  return false;
}

/**
 * Gives a panel its own `ListDetailNav`, so that a detail in it gets the bar of
 * `app-list-detail-bar` outside `app-list-detail`. `appListDetailNav` turns the bar on:
 * while it is false, the sheet bar of the detail keeps its actions.
 */
@Directive({
  selector: '[appListDetailNav]',
  standalone: true,
  providers: [ListDetailNav],
})
export class ListDetailNavDirective {
  readonly on = input(false, { alias: 'appListDetailNav' });

  constructor() {
    const nav = inject(ListDetailNav);
    effect(() => nav.active.set(this.on()));
  }
}
