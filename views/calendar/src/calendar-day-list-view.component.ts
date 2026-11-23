import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  EmptyStateComponent,
  IconComponent,
  ListItemComponent,
  MetaLineComponent,
  SkeletonComponent,
  StatusTextComponent,
  UI_KIT_INTL,
  UiKitTranslatePipe,
} from '@stupa-makers/ui-kit';
import type { CalendarEntry } from './calendar.types';
import { CalendarChevronComponent } from './calendar-chevron.component';
import { answerKey, answerKind, entryIcon, entryTime, kindKey } from './calendar.util';

/**
 * The entries of the picked day beside the desktop month grid: one row group, like the list
 * of Aktivität (001770), a copy of the day list of the app Kalender page. Each row shows the
 * kind, the time, the source, the place and the own answer, and opens its entry. While the
 * first read runs it shows the skeleton, and a failed read shows the face with `errorText`;
 * the app shows the retry.
 */
@Component({
  selector: 'app-calendar-day-list-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarChevronComponent,
    EmptyStateComponent,
    IconComponent,
    ListItemComponent,
    MetaLineComponent,
    SkeletonComponent,
    StatusTextComponent,
    UiKitTranslatePipe,
  ],
  templateUrl: './calendar-day-list-view.component.html',
  styleUrl: './calendar-day-list-view.component.scss',
  host: {
    role: 'region',
    'aria-live': 'polite',
    '[attr.aria-label]': 'label()',
  },
})
export class CalendarDayListViewComponent {
  private readonly i18n = inject(UI_KIT_INTL);

  /** The entries of the picked day. */
  readonly entries = input.required<readonly CalendarEntry[]>();
  /** The name of the list ("Mittwoch, 11. November"). */
  readonly label = input('');
  readonly loading = input(false);
  /** The first read runs: the skeleton shows. */
  readonly firstLoad = input(false);
  /** The read failed: the face with `errorText` shows. */
  readonly error = input(false);
  readonly errorText = input('');

  readonly openEntry = output<CalendarEntry>();

  readonly icon = entryIcon;
  readonly kindKey = kindKey;
  readonly answerKey = answerKey;
  readonly answerKind = answerKind;

  /** "14:00 – 15:30", or the days of an entry over several days. */
  time(e: CalendarEntry): string {
    return entryTime(e, this.i18n.formatLocale());
  }
}
