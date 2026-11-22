/** Fixtures of the activity view (002280) for the specs and the showcase. */
import type { ActivityEntry } from '../views/activity/src/activity.types';

export const ACTIVITY_ENTRIES: readonly ActivityEntry[] = [
  {
    id: 'a1',
    item: { title: 'Zuschuss Sommerfest', icon: 'file', link: { commands: ['/applications', 'x1'] } },
    actor: { name: 'Bob Beispiel' },
    change: 'Kommentar: Danke',
    day: 'Heute',
    time: '14:05',
    new: true,
  },
  {
    id: 'a2',
    item: { title: 'Flyer drucken', icon: 'circleok', link: { commands: ['/todos'], query: { card: 'c7' } } },
    actor: { name: 'Du' },
    change: 'Verschoben nach Erledigt',
    day: 'Heute',
    time: '09:12',
  },
  {
    id: 'a3',
    item: { title: 'StuPa-Sitzung 12', icon: 'users', link: { commands: ['/meetings', 'm12'] } },
    actor: null,
    change: 'Protokoll finalisiert',
    day: 'Gestern',
    time: '19:40',
  },
];
