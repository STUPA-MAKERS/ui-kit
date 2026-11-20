import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/** One choice of a chip group. */
export interface ChipOption {
  readonly value: string;
  readonly label: string;
}

/**
 * A single choice as a row of filter chips that wraps (a payment method, the lifetime of
 * a token). The chosen chip has the selection colour and a check. It follows the WAI-ARIA
 * radio group pattern: one tab stop, the arrow keys move the choice, Home and End jump to
 * the ends. Use it where the choices are too many or too long for `app-segmented`.
 *
 * `<app-chip-group ariaLabelledby="method-cap" [options]="methods" [(value)]="method" />`
 *
 * `--chip-group-height` sets the height of the chips (default 32px).
 */
@Component({
  selector: 'app-chip-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './chip-group.component.html',
  styleUrl: './chip-group.component.scss',
})
export class ChipGroupComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input<readonly ChipOption[]>([]);
  readonly value = model<string | null>(null);
  readonly ariaLabel = input('');
  /** The id of the visible caption of the group. */
  readonly ariaLabelledby = input('');
  /** The check before the chosen label. */
  readonly check = input(true);

  /** The chip that holds the tab stop: the chosen one, else the first. */
  protected readonly focusValue = computed(() => {
    const opts = this.options();
    return (opts.find((o) => o.value === this.value()) ?? opts[0])?.value ?? null;
  });

  protected select(option: ChipOption): void {
    if (option.value !== this.value()) this.value.set(option.value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const next = radioKeyTarget(event.key, index, this.options().length);
    if (next === null) return;
    event.preventDefault();
    this.select(this.options()[next]);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  }
}

/** The index that a key moves to in a radio group of `n` options, or null for another key. */
function radioKeyTarget(key: string, index: number, n: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % n;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + n) % n;
    case 'Home':
      return 0;
    case 'End':
      return n - 1;
    default:
      return null;
  }
}
