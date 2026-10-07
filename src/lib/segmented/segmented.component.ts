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
  /**
   * A count after the label, in a lighter weight (for example the number of invoices in
   * a segment of a list). The screen reader reads it as part of the name.
   */
  count?: number | string | null;
}

/**
 * The width of the segments.
 *
 * - `auto` (default): each segment is as wide as its label.
 * - `equal`: every segment is as wide as the widest one. The control keeps its own width.
 * - `fill`: the control fills the width of its container, and the segments share it in
 *   equal parts. Use it in a form, where the control is as wide as the fields.
 */
export type SegmentedWidth = 'auto' | 'equal' | 'fill';

/**
 * Segmented control: a small set of exclusive options in one row (Ausgabe/Einnahme,
 * Anwesend/Abwesend, a majority rule). It follows the WAI-ARIA radio group pattern:
 * one tab stop, the arrow keys move the selection, Home and End jump to the ends.
 *
 * `<app-segmented ariaLabel="Art" [options]="kinds" [(value)]="kind" />`
 * Works with `ngModel` and reactive forms.
 *
 * `width` sets the width of the segments (see `SegmentedWidth`). An option can carry a
 * `count`, which shows after its label. `check` false leaves out the check mark of the
 * chosen segment.
 */
@Component({
  selector: 'app-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.seg-host--equal]': "width() === 'equal'",
    '[class.seg-host--fill]': "width() === 'fill'",
    '[class.seg-host--control]': "size() === 'control'",
  },
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
  /** The width of the segments: `auto`, `equal` or `fill`. */
  readonly width = input<SegmentedWidth>('auto');
  /**
   * The check mark before the label of the chosen segment. False leaves it out, for
   * segments with a count that must fit a narrow column.
   */
  readonly check = input(true);
  /**
   * The height. `compact` (36px) fits a form or a toolbar. `control` takes the height of
   * a medium button, for a switch that stands beside buttons, as in a page header.
   */
  readonly size = input<'compact' | 'control'>('compact');

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
