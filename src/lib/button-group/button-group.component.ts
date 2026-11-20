import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The actions of a page head or a detail head as one connected button group (app spec
 * 001350, after the connected button group of Material 3 Expressive).
 *
 * The buttons of the group touch with a gap of 2px. Each one is a tonal surface with a
 * corner radius of 8px; the first and the last round their outer ends to half their height.
 * A selected button (`aria-pressed` or `aria-expanded` true, such as an open menu or an open
 * sheet) takes the accent fill and rounds all four corners. A button with only an icon is
 * 48px wide.
 *
 * The buttons of the group are `app-button`, `a[appButton]` and `app-row-menu`. Another
 * control in the group (a content language switch) keeps its own look, and the buttons
 * beside it round their ends towards it. Control flow blocks add no elements, so a button
 * behind `@if` takes its place in the order of the group.
 *
 * The action slots of `app-sheet-bar`, `app-page-header` and the bar of `app-list-detail`
 * are groups already. Use this component for the actions of a head that the kit does not
 * draw.
 *
 * ```html
 * <app-button-group>
 *   <app-button (click)="openComments()"><app-icon name="chat" /> Kommentare</app-button>
 *   <app-button [iconOnly]="true" ariaLabel="Bearbeiten"><app-icon name="edit" /></app-button>
 *   <app-row-menu [sections]="menu()" />
 * </app-button-group>
 * ```
 *
 * The look is in the global stylesheet (`styles/button-group.scss`), because it styles the
 * buttons of other components.
 */
@Component({
  selector: 'app-button-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'btn-grp',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[class.btn-grp--main]': 'main()',
  },
  template: '<ng-content />',
})
export class ButtonGroupComponent {
  /** The accessible name of the group, when the head has more than one group. */
  readonly label = input<string | null>(null);

  /**
   * A confirm row (Abbrechen and the main action): the main button (`variant="fill"`)
   * keeps the accent fill (001353). The footer of `app-dialog` is such a group. Every button
   * of a confirm row is as high as a control (40px), whatever its `size` (001960), so the
   * actions at the end of every dialog, sheet, popover and inline form have one size.
   */
  readonly main = input(false);
}
