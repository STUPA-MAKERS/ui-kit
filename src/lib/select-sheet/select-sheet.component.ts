import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { DialogBodyDirective, DialogComponent } from '../dialog/dialog.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { IconComponent, type IconName } from '../icon/icon.component';
import { UI_KIT_INTL } from '../intl/intl';
import { ScrollFadeDirective } from '../scroll-fade/scroll-fade.directive';
import type { Action, SearchDef } from '../screen/screen.types';
import { SearchPillComponent } from '../search-pill/search-pill.component';
import type { SelectOption } from '../select/select.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/** One choice of the select sheet: a value, its label and an optional line below. */
export interface SelectSheetOption extends SelectOption {
  /** The second line under the label (a date, a number). */
  readonly sub?: string;
}

/**
 * The select sheet (002252): a dialog that picks from a list of rows, with an optional
 * search. It copies the pick dialog of the app ("TOP hinzufügen", "Auf Tagesordnung
 * setzen", the move sheet): the rows of a row group on surface 3 with a check after the
 * chosen one and no radio circle (001790, 001380), an empty state in the middle of the list
 * area, and skeleton rows while `options` is `null`.
 *
 * One choice: `value`. Several (`multi`): `values`. The footer has Abbrechen and the main
 * action (`submitLabel`, `submitIcon`); `picked` gets the choice. The dialog keeps one
 * height for every state, so it does not jump while the search runs. On a phone it is the
 * near-fullscreen sheet of every dialog.
 */
@Component({
  selector: 'app-select-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogComponent,
    DialogBodyDirective,
    EmptyStateComponent,
    IconComponent,
    ScrollFadeDirective,
    SearchPillComponent,
    SkeletonComponent,
  ],
  templateUrl: './select-sheet.component.html',
  styleUrl: './select-sheet.component.scss',
})
export class SelectSheetComponent {
  private readonly intl = inject(UI_KIT_INTL);
  protected readonly name = inject(_IdGenerator).getId('ss-pick-');

  readonly open = model(false);
  readonly heading = input.required<string>();
  /** A line below the heading that names the object or the reason of the pick. */
  readonly subtitle = input('');
  /** The choices; `null` while they load. */
  readonly options = input<readonly SelectSheetOption[] | null>(null);
  /** One choice. */
  readonly value = model<string | null>(null);
  /** Several choices: checkboxes instead of radios, the result in `values`. */
  readonly multi = input(false);
  readonly values = model<readonly string[]>([]);
  /** The search above the list; no search without it. */
  readonly search = input<SearchDef | null>(null);
  readonly query = model('');
  /** The name of the list for a screen reader. */
  readonly listLabel = input.required<string>();
  /** The heading of the empty state. */
  readonly emptyHeading = input.required<string>();
  readonly emptyIcon = input<IconName>('circleok');
  readonly submitLabel = input.required<string>();
  readonly submitIcon = input<IconName | null>(null);
  /** The main action works: it shows a spinner and takes no press. */
  readonly busy = input(false);
  /** The choice, on a press of the main action. */
  readonly picked = output<string | readonly string[]>();

  protected readonly loadingLabel = computed(() => this.intl.translate('loading'));

  private readonly chosen = computed(() =>
    this.multi() ? this.values().length > 0 : !!this.value(),
  );

  protected readonly actions = computed<readonly Action[]>(() => [
    { key: 'cancel', label: this.intl.translate('confirm.cancel') },
    {
      key: 'submit',
      label: this.submitLabel(),
      icon: this.submitIcon() ?? undefined,
      kind: 'main',
      disabled: !this.chosen() || this.busy(),
      busy: this.busy(),
    },
  ]);

  protected isOn(value: string): boolean {
    return this.multi() ? this.values().includes(value) : this.value() === value;
  }

  protected toggle(o: SelectSheetOption): void {
    if (o.disabled) return;
    if (!this.multi()) {
      this.value.set(o.value);
      return;
    }
    const vs = this.values();
    this.values.set(vs.includes(o.value) ? vs.filter((v) => v !== o.value) : [...vs, o.value]);
  }

  protected onAction(key: string): void {
    if (key === 'cancel') this.cancel();
    else this.submit();
  }

  submit(): void {
    if (!this.chosen() || this.busy()) return;
    const v = this.value();
    this.picked.emit(this.multi() ? this.values() : (v as string));
  }

  cancel(): void {
    this.open.set(false);
  }
}
