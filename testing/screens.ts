/** Fixtures of the screen specs: rows, groups and filters of a list. */
import type { FilterDef, ListGroup, ListRow } from '@stupa-makers/ui-kit';

export const LIST_ROWS: readonly ListRow[] = [
  {
    id: '1',
    title: 'Zuschuss Sommerfest',
    meta: ['Fachschaft Informatik'],
    status: { label: 'In Prüfung', kind: 'accent' },
    link: { commands: ['/applications', '1'] },
  },
  {
    id: '2',
    title: 'Beamer für den Hörsaal',
    meta: ['AStA'],
    status: { label: 'Rückfrage', kind: 'warn' },
    trailing: '890,00 €',
    link: { commands: ['/applications', '2'] },
  },
];

export const LIST_GROUPS: readonly ListGroup[] = [
  { key: 'open', label: 'Offen', rows: LIST_ROWS.slice(0, 1) },
  { key: 'done', label: 'Erledigt', rows: LIST_ROWS.slice(1) },
];

export const LIST_FILTERS: readonly FilterDef[] = [
  {
    key: 'state',
    label: 'Status',
    kind: 'single',
    value: null,
    options: [
      { value: 'open', label: 'Offen' },
      { value: 'done', label: 'Erledigt' },
    ],
  },
];
