/** Fixtures of the screen specs: rows, groups and filters of a list. */
import type {
  FilterDef,
  ListGroup,
  ListRow,
  ScreenHead,
  ScreenTab,
  SideSheetDef,
} from '@stupa-makers/ui-kit';

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

/** The head of a detail: title, kicker, status and meta chips. */
export const DETAIL_HEAD: ScreenHead = {
  title: 'Zuschuss Sommerfest',
  kicker: 'Antrag A-0042',
  status: { label: 'In Prüfung', kind: 'accent' },
  meta: [{ label: 'Fachschaft Informatik', icon: 'users' }, { label: '19.10.2026' }],
};

export const DETAIL_TABS: readonly ScreenTab[] = [
  { key: 'data', label: 'Antrag' },
  { key: 'history', label: 'Verlauf' },
  { key: 'hidden', label: 'Versteckt', hidden: true },
];

export const DETAIL_SHEETS: readonly SideSheetDef[] = [
  { key: 'votes', label: 'Abstimmungen', icon: 'vote', mark: 'new' },
  { key: 'links', label: 'Verknüpfungen', icon: 'link', replaces: true },
];
