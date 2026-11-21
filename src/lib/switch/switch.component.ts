import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { MatSlideToggle } from '@angular/material/slide-toggle';

let nextId = 0;

/**
 * On/off switch for a setting that takes effect at once (a notification, a flag of a
 * gremium). Inside it is the M3 switch of Angular Material (spec 002293): a native button with
 * `role="switch"` and `aria-checked`, so Space and Enter toggle it and a screen reader
 * announces the state. The colours come from the `--check-*` tokens of the kit (002295).
 *
 * The label is projected and sits before the switch:
 * `<app-switch [(checked)]="mail">E-Mail bei neuen Anträgen</app-switch>`.
 * Without a visible label, set `ariaLabel`. Works with `ngModel` and reactive forms.
 */
@Component({
  selector: 'app-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggle],
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
    this.set(!this.checked());
  }

  /** The switch changed: Material reports the new value. */
  protected set(value: boolean): void {
    this.checked.set(value);
    this.onChange(value);
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
