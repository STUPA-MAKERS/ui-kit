import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { IconComponent, UI_KIT_INTL, UiKitTranslatePipe } from '@stupa-makers/ui-kit';
import type { CalendarEntry } from './calendar.types';
import { fullDate, parseDay } from './calendar-format';
import { type CalendarDay, shiftDay } from './calendar-grid.util';
import { type MonthRow, entryIcon, entryTime, kindKey } from './calendar.util';

const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/**
 * The month grid of the desktop Kalender: a copy of the grid of the app Kalender page. Each
 * day is its own segment, 2px apart (001780); an entry over several days is a bar over its
 * days. A press on a day picks it. The arrow keys move the picked day (a day left or right, a
 * week up or down), Home and End go to the start and the end of the week, and the focus
 * follows the day. The host is the grid.
 */
@Component({
  selector: 'app-calendar-month-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, UiKitTranslatePipe],
  templateUrl: './calendar-month-view.component.html',
  styleUrl: './calendar-month-view.component.scss',
  host: {
    role: 'grid',
    tabindex: '-1',
    '[attr.aria-label]': 'label()',
    '[attr.aria-busy]': "loading() ? 'true' : null",
    '[class.calm--wide]': 'wide()',
    '(keydown)': 'onKey($event)',
  },
})
export class CalendarMonthViewComponent {
  private readonly i18n = inject(UI_KIT_INTL);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** The weeks of the month with their entries (`monthRows`). */
  readonly rows = input.required<readonly MonthRow[]>();
  /** The short weekday names, Monday first. */
  readonly weekdays = input.required<readonly string[]>();
  /** The picked day, `YYYY-MM-DD`. */
  readonly selectedDay = input.required<string>();
  /** The name of the grid ("November 2026"). */
  readonly label = input('');
  readonly loading = input(false);
  /** The page fills the window: the weeks share its height. */
  readonly wide = input(false);

  /** A day was picked. */
  readonly selectDay = output<string>();

  onKey(event: KeyboardEvent): void {
    const day = parseDay(this.selectedDay());
    if (!day) return;
    const weekday = (day.getDay() + 6) % 7;
    const delta: number | undefined =
      event.key === 'Home' ? -weekday : event.key === 'End' ? 6 - weekday : KEY_STEPS[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    this.selectDay.emit(shiftDay(this.selectedDay(), delta));
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.cal__day[tabindex="0"]')?.focus(),
      { injector: this.injector },
    );
  }

  /** The name of a day cell for a screen reader: "Mittwoch, 11. November 2026, Heute, 2 Einträge". */
  dayLabel(day: CalendarDay, count: number): string {
    const text = fullDate(day.iso, this.i18n.formatLocale()) || day.iso;
    const today = day.isToday ? `, ${this.i18n.translate('meetings.overview.today')}` : '';
    const entries =
      count === 0
        ? this.i18n.translate('calendar.day.none')
        : count === 1
          ? this.i18n.translate('calendar.day.one')
          : this.i18n.translate('calendar.day.many', { n: count });
    return `${text}${today}, ${entries}`;
  }

  readonly icon = entryIcon;
  readonly kindKey = kindKey;

  /** "14:00 – 15:30", or the days of an entry over several days. */
  time(e: CalendarEntry): string {
    return entryTime(e, this.i18n.formatLocale());
  }
}
