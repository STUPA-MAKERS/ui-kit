import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { UI_KIT_INTL } from '../intl/intl';

/**
 * The pair of round icon buttons that moves an item of a list one step up or down
 * ("Nach oben", "Nach unten"). The host has no box (`display: contents`), so the buttons
 * sit in the row of the page like its other icon buttons.
 *
 * `<app-move-buttons [upDisabled]="first" [downDisabled]="last" (move)="move(i, $event)" />`
 *
 * `upLabel` and `downLabel` replace the built-in names, for example to add the item
 * ("Nach oben: Spalte 2"); the name is also the tooltip. Use {@link moveItem} for a plain
 * swap in an array.
 */
@Component({
  selector: 'app-move-buttons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './move-buttons.component.html',
  styleUrl: './move-buttons.component.scss',
})
export class MoveButtonsComponent {
  private readonly intl = inject(UI_KIT_INTL);

  readonly upLabel = input('');
  readonly downLabel = input('');
  readonly upDisabled = input(false);
  readonly downDisabled = input(false);
  /** `-1` for up, `1` for down. */
  readonly move = output<-1 | 1>();

  protected readonly up = computed(() => this.upLabel() || this.intl.translate('move.up'));
  protected readonly down = computed(() => this.downLabel() || this.intl.translate('move.down'));
}
