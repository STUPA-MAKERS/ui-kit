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
    '[class.ld__bar--condensed]': 'nav.condensed() || title() !== null',
  },
  templateUrl: './list-detail-bar.component.html',
  styleUrl: './list-detail-bar.component.scss',
})
export class ListDetailBarComponent {
  protected readonly nav = inject(ListDetailNav);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly backButton = viewChild.required<ElementRef<HTMLButtonElement>>('backButton');

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

  constructor() {
    this.nav.barBottom = () => this.host.getBoundingClientRect().bottom;
    inject(DestroyRef).onDestroy(() => (this.nav.barBottom = () => 0));
  }

  /** Put the focus on the back arrow. */
  focus(): void {
    this.backButton().nativeElement.focus();
  }
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
