import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

let nextId = 0;

/**
 * Filled text field with the label inside the box, a hint and an error. Implements
 * ControlValueAccessor for reactive forms and `ngModel`.
 */
@Component({
  selector: 'app-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: InputComponent, multi: true }],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  /** Accessible name when the field has no visible label (for example a search field). */
  @Input() ariaLabel = '';
  /**
   * A unit at the end of the box, on the line of the value ("Tage", "Minuten"). The
   * control names it in its description, so a screen reader reads "30, Tage".
   */
  @Input() suffix = '';
  @Input() id = `app-input-${nextId++}`;

  readonly value = signal('');
  readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get describedBy(): string | null {
    const ids: string[] = [];
    if (this.suffix) ids.push(`${this.id}-suffix`);
    if (this.error) ids.push(`${this.id}-error`);
    else if (this.hint) ids.push(`${this.id}-hint`);
    return ids.length ? ids.join(' ') : null;
  }

  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
