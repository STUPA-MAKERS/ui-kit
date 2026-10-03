import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

let nextId = 0;

/**
 * On/off switch for a setting that takes effect at once (a notification, a flag of a
 * gremium). It is a native button with `role="switch"` and `aria-checked`, so Space and
 * Enter toggle it and a screen reader announces the state.
 *
 * The label is projected and sits before the switch:
 * `<app-switch [(checked)]="mail">E-Mail bei neuen Anträgen</app-switch>`.
 * Without a visible label, set `ariaLabel`. Works with `ngModel` and reactive forms.
 */
@Component({
  selector: 'app-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: SwitchComponent, multi: true }],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
})
export class SwitchComponent implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false);
  readonly ariaLabel = input('');
  readonly hint = input('');
  readonly id = input(`app-switch-${nextId++}`);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  toggle(): void {
    if (this.isDisabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
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
    this.formDisabled.set(isDisabled);
  }
}
