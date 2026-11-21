/** Fixtures of the screen specs: rows, groups and filters of a list. */
import type {
  FormDef,
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

/** A form with every field kind (002255). */
export const FORM_DEF: FormDef = {
  sections: [
    {
      key: 'main',
      label: 'Antrag',
      fields: [
        { key: 'title', kind: 'text', label: 'Titel', required: true, maxLength: 40 },
        { key: 'text', kind: 'textarea', label: 'Begründung' },
        { key: 'mail', kind: 'email', label: 'E-Mail', width: 'half' },
        { key: 'site', kind: 'url', label: 'Webseite', width: 'half' },
        { key: 'iban', kind: 'iban', label: 'IBAN' },
        { key: 'count', kind: 'number', label: 'Personen', min: 1, max: 50, width: 'half' },
        { key: 'amount', kind: 'money', label: 'Betrag', width: 'half' },
        { key: 'day', kind: 'date', label: 'Tag', width: 'half' },
        { key: 'time', kind: 'time', label: 'Uhrzeit', width: 'half' },
        { key: 'period', kind: 'date-range', label: 'Zeitraum' },
        {
          key: 'gremium',
          kind: 'select',
          label: 'Gremium',
          options: [
            { value: 'stupa', label: 'StuPa' },
            { value: 'asta', label: 'AStA' },
          ],
        },
        {
          key: 'tags',
          kind: 'multi-select',
          label: 'Bereiche',
          options: [
            { value: 'kultur', label: 'Kultur' },
            { value: 'sport', label: 'Sport' },
          ],
        },
        {
          key: 'centre',
          kind: 'tree-select',
          label: 'Kostenstelle',
          leavesOnly: true,
          tree: [
            {
              value: 'a',
              label: 'Allgemein',
              children: [{ value: 'a1', label: 'Büro' }],
            },
          ],
        },
        { key: 'public', kind: 'switch', label: 'Öffentlich' },
        { key: 'agree', kind: 'checkbox', label: 'Ich stimme zu', required: true },
        { key: 'files', kind: 'file', label: 'Anlagen', multiple: true },
        { key: 'note', kind: 'display', text: 'Die Angaben gehen an das Präsidium.', label: '' },
      ],
    },
    {
      key: 'costs',
      label: 'Kosten',
      fields: [
        {
          key: 'items',
          kind: 'repeat',
          label: 'Posten',
          addLabel: 'Posten hinzufügen',
          min: 1,
          fields: [
            { key: 'what', kind: 'text', label: 'Was', required: true, width: 'half' },
            { key: 'cost', kind: 'money', label: 'Kosten', width: 'half' },
          ],
        },
      ],
    },
  ],
};
