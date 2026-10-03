import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

/** One option of a segmented control. */
export interface SegmentedOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Segmented control: a small set of exclusive options in one row (Ausgabe/Einnahme,
 * Anwesend/Abwesend, a majority rule). It follows the WAI-ARIA radio group pattern:
 * one tab stop, the arrow keys move the selection, Home and End jump to the ends.
 *
 * `<app-segmented ariaLabel="Art" [options]="kinds" [(value)]="kind" />`
 * Works with `ngModel` and reactive forms.
 */
@Component({
  selector: 'app-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: SegmentedComponent, multi: true }],
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.scss',
})
export class SegmentedComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input<readonly SegmentedOption[]>([]);
  readonly value = model<string | null>(null);
  readonly ariaLabel = input('');
  readonly disabled = input(false);

  private readonly formDisabled = signal(false);
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** The option that holds the tab stop: the selected one, else the first enabled one. */
  protected readonly focusValue = computed(() => {
    const opts = this.options();
    const current = opts.find((o) => o.value === this.value() && !o.disabled);
    return (current ?? opts.find((o) => !o.disabled))?.value ?? null;
  });

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  select(option: SegmentedOption): void {
    if (this.isDisabled() || option.disabled || option.value === this.value()) return;
    this.value.set(option.value);
    this.onChange(option.value);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const opts = this.options();
    let next = -1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.step(index, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.step(index, -1);
        break;
      case 'Home':
        next = this.step(-1, 1);
        break;
      case 'End':
        next = this.step(opts.length, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) return;
    this.select(opts[next]);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }

  /** Index of the next enabled option from `from` in direction `dir`, with wrap-around. */
  private step(from: number, dir: 1 | -1): number {
    const opts = this.options();
    const n = opts.length;
    for (let i = 1; i <= n; i++) {
      const idx = (((from + dir * i) % n) + n) % n;
      if (!opts[idx].disabled) return idx;
    }
    return -1;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
