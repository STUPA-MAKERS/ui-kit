import {
  ChangeDetectionStrategy,
  Component,
  Input,
  booleanAttribute,
  input,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

let nextId = 0;

/**
 * Checkbox des UI-Kits. Boolescher Wert über `ControlValueAccessor`
 * (Reactive Forms + `ngModel`). Token-basiert (`accent-color` = CD-Primär),
 * sichtbarer Fokus-Ring (global `:focus-visible`), Label/`for`-Bindung für a11y.
 * Label-Text wird projiziert: `<app-checkbox [(ngModel)]="x">Text</app-checkbox>`.
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

  onToggle(event: Event): void {
    const box = event.target as HTMLInputElement;
    const v = box.checked;
    // A click clears the native mixed state. The input stays the source of truth.
    box.indeterminate = this.indeterminate();
    this.checked.set(v);
    this.onChange(v);
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
