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
  readonly value: string;
  readonly label: string;
  /** A disabled option cannot be chosen: a click and the arrow keys skip it. */
  readonly disabled?: boolean;
  /**
   * A tooltip (the native `title`), for example the reason why the option is disabled.
   * It does not change the accessible name, which stays the label.
   */
  readonly title?: string;
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
 * Anwesend/Abwesend, a majority rule). It is a pill track, and the chosen option is a
 * filled pill in it (app spec 000561). A segment shows its label and never a count (app
 * spec 000560). It follows the WAI-ARIA radio group pattern:
 * one tab stop, the arrow keys move the selection, Home and End jump to the ends.
 *
 * `<app-segmented ariaLabel="Art" [options]="kinds" [(value)]="kind" />`
 * Works with `ngModel` and reactive forms.
 *
 * `width` sets the width of the segments (see `SegmentedWidth`).
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
   * The height. `compact` (a 44px track around a 36px pill) fits a form or a toolbar.
   * `control` takes the height of a medium button, for a switch that stands beside buttons,
   * as in a page header.
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
    const next = this.keyTarget(event.key, index);
    if (next === null) return;
    event.preventDefault();
    if (next < 0) return;
    this.select(opts[next]);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }

  /** Index of the next enabled option from `from` in direction `dir`, with wrap-around. */
  private step(from: number, dir: 1 | -1): number {
    const opts = this.options();
    const n = opts.length;
    const ring = Array.from({ length: n }, (_, i) => (((from + dir * (i + 1)) % n) + n) % n);
    return ring.find((idx) => !opts[idx].disabled) ?? -1;
  }

  /** The index a key moves to (-1 when no option is enabled), or null for another key. */
  private keyTarget(key: string, index: number): number | null {
    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        return this.step(index, 1);
      case 'ArrowLeft':
      case 'ArrowUp':
        return this.step(index, -1);
      case 'Home':
        return this.step(-1, 1);
      case 'End':
        return this.step(this.options().length, -1);
      default:
        return null;
    }
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
