import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface Step {
  label: string;
  /** A second line below the label, for example the chosen value of a done step. */
  hint?: string | null;
}

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * Progress of a multi-step form, for example the apply wizard.
 *
 * - `horizontal` (default): one line of numbered steps.
 * - `vertical`: one row per step with the label and an optional `hint` below it. The
 *   current step has the selected surface.
 *
 * A done step shows a check, the current step the accent fill and `aria-current="step"`.
 * With `navigable`, every done step is a button that emits its index (`stepSelect`), so
 * the page can go back to it. The steps after the current one never take a click: the
 * page checks a step before it moves on.
 */
@Component({
  selector: 'app-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, IconComponent],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent {
  @Input() steps: Step[] = [];
  @Input() activeIndex = 0;
  @Input() ariaLabel = 'Fortschritt';
  @Input() orientation: StepperOrientation = 'horizontal';
  /** Done steps become buttons that emit `stepSelect`. */
  @Input() navigable = false;

  /** The index of a done step the user clicked (only with `navigable`). */
  @Output() readonly stepSelect = new EventEmitter<number>();

  protected select(index: number): void {
    if (this.navigable && index < this.activeIndex) this.stepSelect.emit(index);
  }
}
