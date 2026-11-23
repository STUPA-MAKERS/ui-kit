import { type UiKitCalendarTextKey, type UiKitTexts } from '@stupa-makers/ui-kit';

/** The DE and EN texts of the calendar views (002237). A view registers them when it is created. */
export const UI_KIT_CALENDAR_TEXTS: UiKitTexts<UiKitCalendarTextKey> = {
  de: {
    'calendar.allDay': 'Ganztägig',
    'calendar.day.empty': 'Keine Einträge an diesem Tag.',
    'calendar.day.many': '{n} Einträge',
    'calendar.day.none': 'keine Einträge',
    'calendar.day.one': '1 Eintrag',
    'calendar.detail.when': 'Wann',
    'calendar.external.calendar': 'Kalender',
    'calendar.field.place': 'Ort',
    'calendar.filter.gremium': 'Gremium',
    'calendar.public.protocol': 'Protokoll ansehen',
    'calendar.public.tops': 'Tagesordnung',
    'meetings.overview.more': '+{n} weitere',
    'meetings.overview.today': 'Heute',
  },
  en: {
    'calendar.allDay': 'All day',
    'calendar.day.empty': 'No entries on this day.',
    'calendar.day.many': '{n} entries',
    'calendar.day.none': 'no entries',
    'calendar.day.one': '1 entry',
    'calendar.detail.when': 'When',
    'calendar.external.calendar': 'Calendar',
    'calendar.field.place': 'Place',
    'calendar.filter.gremium': 'Committee',
    'calendar.public.protocol': 'Open minutes',
    'calendar.public.tops': 'Agenda',
    'meetings.overview.more': '+{n} more',
    'meetings.overview.today': 'Today',
  },
};
