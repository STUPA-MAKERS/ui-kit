import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@stupa-makers/ui-kit';

/** The arrow at the end of a day row that opens an entry: copy of the app row chevron. */
@Component({
  selector: 'app-calendar-chevron',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: '<app-icon name="right" [size]="17" />',
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      color: var(--color-text-muted);
      margin-inline-end: calc(-1 * var(--space-2));
    }
  `,
})
export class CalendarChevronComponent {}
