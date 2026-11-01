import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from '@stupa-makers/ui-kit';

/**
 * A button in the look of a rail entry, for the `[shellRailEnd]` slot of `app-shell`, for
 * example a theme switch. Handle `(click)` on the element. The host has no box of its own
 * (`display: contents`), so the button takes the place of an entry.
 *
 * ```html
 * <app-rail-button shellRailEnd icon="moon" label="Dark" (click)="theme.toggle()" />
 * ```
 */
@Component({
  selector: 'app-rail-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `<button
    type="button"
    class="rail__item"
    [class.is-active]="active()"
    [attr.aria-pressed]="pressed()"
  >
    <span class="rail__ind"><app-icon [name]="icon()" [size]="22" /></span>
    <span class="rail__label">{{ label() }}</span>
  </button>`,
  styleUrl: './rail-button.scss',
})
export class RailButtonComponent {
  readonly icon = input.required<IconName>();
  /** The visible label and the accessible name. */
  readonly label = input.required<string>();
  /** Show the entry as the active one. */
  readonly active = input(false);
  /** `aria-pressed` for a toggle; `null` leaves it out. */
  readonly pressed = input<boolean | null>(null);
}

/**
 * A button in the look of a bottom bar entry, for the `[shellBarEnd]` slot of `app-shell`.
 * Handle `(click)` on the element. The host has no box of its own (`display: contents`),
 * so the button shares the bar with the entries.
 */
@Component({
  selector: 'app-bar-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `<button
    type="button"
    class="bb__item"
    [class.is-active]="active()"
    [attr.aria-pressed]="pressed()"
  >
    <span class="bb__ind"><app-icon [name]="icon()" [size]="22" /></span>
    <span class="bb__label">{{ label() }}</span>
  </button>`,
  styleUrl: './bar-button.scss',
})
export class BarButtonComponent {
  readonly icon = input.required<IconName>();
  /** The visible label and the accessible name. */
  readonly label = input.required<string>();
  /** Show the entry as the active one. */
  readonly active = input(false);
  /** `aria-pressed` for a toggle; `null` leaves it out. */
  readonly pressed = input<boolean | null>(null);
}
