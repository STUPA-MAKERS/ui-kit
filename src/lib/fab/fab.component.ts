import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent, type IconName } from '../icon/icon.component';
import { FabGroupComponent } from './fab-group.component';

/**
 * The floating main action of a page: one per page, at the bottom end of the content, on
 * every width. It is the "new" action of a list, or the save action (`icon="check"`,
 * `[loading]` while the save runs) of an editor or a settings page. The save action shows
 * only while the page has unsaved changes, and it replaces the "new" action of the page
 * then, so a page never shows two floating buttons.
 *
 * The look is the kit button `variant="fab"`: 56px high, accent surface, the elevated
 * shadow, the icon and the label in one row. The label always shows, also on a phone.
 *
 * Position:
 *
 * - Default: fixed at the end edge of the content column, above the bottom of the window
 *   or above the phone bottom bar (`--app-bottom-inset` holds the bar and the safe area).
 *   The end edge is the gutter beside a centred column (`--layout-max-width`, less
 *   `--rail-width`), or the gutter of a wide page (`.main--wide`). In a phone frame
 *   (`.frame--phone`) it sits 16px from the end and the bottom. `--fab-inset` adds the side
 *   padding of a sheet, so the button clears its round corner, and `--pane-foot-gap`
 *   replaces the gutter below it.
 * - `contained`: absolute at the bottom end of the nearest positioned ancestor, for a list
 *   pane beside a detail pane (`.ld-pane` is positioned).
 *
 * The button floats over the content, so the end of what scrolls below it keeps room for
 * it: a list pane pads its end by `calc(56px + var(--space-6))` (see `frame` of
 * `list-pane`).
 *
 * It sits below dialogs, sheets and drawers (`--z-sticky`). A page hides it while a
 * selection bar or a form with its own primary action is open.
 *
 * `iconOnly` makes it the round 56px icon button; the label is then its accessible name
 * and its title. `tone="neutral"` gives it the surface of a secondary action, for example
 * "Reset" beside "Save".
 *
 * Several floating buttons of one page sit side by side in an `app-fab-group`, which takes
 * the position at the bottom end; a fab in a group has no position of its own.
 *
 * To open a route, handle `activate` and navigate, or use `FabLinkDirective` of
 * `@stupa-makers/ui-kit/shell` (`<app-fab link="/apply" …>`).
 */
@Component({
  selector: 'app-fab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  host: {
    class: 'fab',
    '[class.fab--contained]': 'contained()',
    '[class.fab--grouped]': 'grouped',
    '[class.fab--neutral]': "tone() === 'neutral'",
  },
  template: `<app-button
    variant="fab"
    [iconOnly]="iconOnly()"
    [ariaLabel]="label()"
    [title]="iconOnly() ? label() : ''"
    [loading]="loading()"
    [disabled]="disabled()"
    (click)="onClick()"
  >
    <app-icon [name]="icon()" />{{ iconOnly() ? '' : label() }}
  </app-button>`,
  styleUrl: './fab.component.scss',
})
export class FabComponent {
  /** The visible text and the accessible name, for example "New application". */
  readonly label = input.required<string>();
  readonly icon = input<IconName>('plus');
  /** Absolute in the nearest positioned ancestor instead of fixed in the window. */
  readonly contained = input(false);
  /** The action runs, for example a save: the button shows the spinner and takes no click. */
  readonly loading = input(false);
  /** The action cannot run now, for example a save of a form with an error. */
  readonly disabled = input(false);
  /** The round icon button without the visible label. */
  readonly iconOnly = input(false);
  /** `accent`: the main action. `neutral`: a secondary action beside it in a group. */
  readonly tone = input<'accent' | 'neutral'>('accent');

  /** The fab sits in an `app-fab-group`, which positions it. */
  protected readonly grouped = !!inject(FabGroupComponent, { optional: true });

  /** The button was pressed. */
  readonly activate = output<void>();

  protected onClick(): void {
    if (this.loading() || this.disabled()) return;
    this.activate.emit();
  }
}
