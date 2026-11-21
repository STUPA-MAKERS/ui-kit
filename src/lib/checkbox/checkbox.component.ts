import {
  ChangeDetectionStrategy,
  Component,
  Input,
  booleanAttribute,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';

let nextId = 0;

/**
 * The checkbox of the kit: the M3 checkbox of Angular Material inside (spec 002293), with the
 * kit API. The value goes through `ControlValueAccessor` (reactive forms and `ngModel`). The
 * label text is projected: `<app-checkbox [(ngModel)]="x">Text</app-checkbox>`. The colours
 * come from the kit tokens (002294); the display modes set the tokens of the box (002295).
 *
 * `indeterminate` shows the mixed state (a dash), for a select-all box over a partial
 * selection: `<app-checkbox [indeterminate]="some()" [ngModel]="all()">`. The input is
 * the source of truth: a click changes the value, but the box stays mixed until the host
 * sets `indeterminate` to false. The native control carries the state, so a screen
 * reader announces "mixed".
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCheckbox],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CheckboxComponent, multi: true }],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() id = `app-checkbox-${nextId++}`;
  @Input() hint = '';
  /** The mixed state (a dash in the box), for a select-all box over a partial selection. */
  readonly indeterminate = input(false, { transform: booleanAttribute });

  readonly checked = signal(false);
  readonly disabled = signal(false);

  private onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  private readonly box = viewChild.required(MatCheckbox);

  /** A click changes the value; a mixed box stays mixed until the host clears `indeterminate`. */
  onToggle(value: boolean): void {
    this.checked.set(value);
    this.onChange(value);
  }

  /** Material clears the mixed state after a click; the input stays the source of truth. */
  protected keepMixed(): void {
    const box = this.box();
    if (box.indeterminate !== this.indeterminate()) box.indeterminate = this.indeterminate();
  }

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
