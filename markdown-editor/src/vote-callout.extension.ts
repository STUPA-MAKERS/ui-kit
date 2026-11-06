import { Node, mergeAttributes } from '@tiptap/core';

/**
 * The vote callout of the protocol as one card.
 *
 * The protocol writes a vote as
 *
 *     > [!abstimmung] **Frage**
 *     > ja: 3, nein: 1, enthaltung: 0
 *
 * The render service reads the counts from the tally line and renders its tally box.
 * The editor shows the same block as a card and writes it back line for line, so the
 * Markdown that leaves the editor is the Markdown that came in. The card is one atom:
 * it is selected and deleted as a whole, its text is not edited in place.
 *
 * The card shows a caption, the question, the counts and a bar of the counts. The
 * consumer can add what the Markdown does not hold through a resolver
 * (`VoteCalloutInfo`): the caption with the time and the majority rule, the result
 * under that rule, and the labels in the language of the page. A callout without a
 * tally line can hold an election or a poll, which the card shows as a ranking.
 */

const MARKER = /^\[!(abstimmung|vote)\]\s*/i;

const TALLY: Record<'yes' | 'no' | 'abstain', RegExp> = {
  yes: /(?:ja|yes)\s*[:=]?\s*(\d+)/i,
  no: /(?:nein|no)\s*[:=]?\s*(\d+)/i,
  abstain: /(?:enthaltung|enth\.?|abstain)\s*[:=]?\s*(\d+)/i,
};

/** A line carries the counts when at least two of the three appear, as in pytex. */
function isTallyLine(line: string): boolean {
  return Object.values(TALLY).filter((rx) => rx.test(line)).length >= 2;
}

function count(line: string, key: keyof typeof TALLY): number {
  const match = TALLY[key].exec(line);
  return match ? Number(match[1]) : 0;
}

/** Inline emphasis and code markers drop for the card text; the source keeps them. */
function plainText(markdown: string): string {
  return markdown.replace(/\*\*|__|`/g, '').trim();
}

export interface VoteCard {
  readonly kind: string;
  readonly question: string;
  readonly tally: { readonly yes: number; readonly no: number; readonly abstain: number } | null;
  readonly body: readonly string[];
  readonly result: 'passed' | 'rejected' | 'tie' | 'none';
}

/** Read the card from the raw callout lines, the marker line first. */
export function parseVoteCallout(raw: string): VoteCard {
  const lines = raw.split('\n');
  const first = lines[0] ?? '';
  const marker = MARKER.exec(first);
  const kind = marker ? marker[1].toLowerCase() : 'abstimmung';
  const question = plainText(first.replace(MARKER, ''));
  const rest = lines.slice(1).map((l) => l.trim()).filter((l) => l.length > 0);
  const tallyLine = rest.find(isTallyLine);
  const tally = tallyLine
    ? { yes: count(tallyLine, 'yes'), no: count(tallyLine, 'no'), abstain: count(tallyLine, 'abstain') }
    : null;
  const body = rest.filter((l) => l !== tallyLine).map(plainText);
  const result: VoteCard['result'] = !tally
    ? 'none'
    : tally.yes > tally.no
      ? 'passed'
      : tally.yes < tally.no
        ? 'rejected'
        : 'tie';
  return { kind, question, tally, body, result };
}

/** One candidate row of an election callout. */
export interface ElectionRow {
  readonly name: string;
  readonly votes: number;
  readonly elected: boolean;
}

/**
 * A personnel election in a callout. The protocol writes it as
 *
 *     > [!abstimmung] **Frage**
 *     > Wahl · 2 Posten
 *     > Anna: 5 · Ben: 3 · Cem: 3 · Enthaltungen: 1
 *     > Gewählt: Anna, Ben
 *     > Durch Los entschieden.
 *
 * The public protocol writes only the elected people and "3 weitere Kandidierende".
 */
export interface ElectionCard {
  /** The line "Wahl · 2 Posten". */
  readonly meta: string;
  /** The candidates, best first, the elected first within equal votes. */
  readonly rows: readonly ElectionRow[];
  readonly abstentions: number | null;
  /** The elected people of the public form, which has no counts. */
  readonly elected: readonly string[];
  readonly others: number;
  readonly lot: 'drawn' | 'pending' | null;
  /** Lines the card does not read (a runoff note of an older election). */
  readonly notes: readonly string[];
}

const ELECTION_META = /^(?:Wahl|Stichwahl)\b.*·\s*\d+\s+Posten/;
const ELECTION_ELECTED = /^Gewählt:\s*(.*)$/;
const ELECTION_OTHERS = /^(\d+) weitere Kandidierende$/;
const ELECTION_PENDING = /^Gleichstand: das Los steht aus\.?$/;
const ELECTION_COUNTS = /^.+:\s*\d+(\s+·\s+.+:\s*\d+)*$/;

/** The kind of one line of an election callout, the first test that holds wins. */
type ElectionLineKind = 'elected' | 'others' | 'drawn' | 'pending' | 'counts' | 'note';

const ELECTION_LINE_TESTS: readonly (readonly [ElectionLineKind, (line: string) => boolean])[] = [
  ['elected', (line) => ELECTION_ELECTED.test(line)],
  ['others', (line) => ELECTION_OTHERS.test(line)],
  ['drawn', (line) => line === 'Durch Los entschieden.'],
  ['pending', (line) => ELECTION_PENDING.test(line)],
  ['counts', (line) => ELECTION_COUNTS.test(line)],
];

/** The kind of one line of an election callout. */
function electionLineKind(line: string): ElectionLineKind {
  return ELECTION_LINE_TESTS.find(([, test]) => test(line))?.[0] ?? 'note';
}

/** The "name: n" parts of a counts line; the part "Enthaltungen" is the abstentions. */
function countParts(line: string): readonly { readonly name: string; readonly votes: number }[] {
  return line
    .split(/\s+·\s+/)
    .map((part) => /^(.*):\s*(\d+)$/.exec(part))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({ name: match[1], votes: Number(match[2]) }));
}

/**
 * The indexes of the rows that the line "Gewählt: …" names. The longer names match
 * first and each match leaves the list, so a name with ", " stays whole.
 */
function electedIndexes(rows: readonly ElectionRow[], electedRaw: string): ReadonlySet<number> {
  const byLength = rows
    .map((_row, i) => i)
    .sort((a, b) => rows[b].name.length - rows[a].name.length);
  return byLength.reduce(
    (found, i) =>
      found.rest.includes(rows[i].name)
        ? { rest: found.rest.replace(rows[i].name, ''), hits: new Set([...found.hits, i]) }
        : found,
    { rest: electedRaw, hits: new Set<number>() as ReadonlySet<number> },
  ).hits;
}

/**
 * Read an election from the lines after the question. A callout without the line
 * "Wahl · n Posten", or with a single candidate (its Ja/Nein line), is no ranking.
 *
 * The first counts line with a candidate gives the rows; a later counts line is a note.
 */
export function parseElection(lines: readonly string[]): ElectionCard | null {
  const metaIndex = lines.findIndex((l) => ELECTION_META.test(l));
  if (metaIndex < 0 || lines.some((l) => /^Kandidatur:/.test(l))) return null;
  const read = lines
    .filter((_, i) => i !== metaIndex)
    .map((line) => ({ line, kind: electionLineKind(line) }));
  const ofKind = (kind: ElectionLineKind) => read.filter((r) => r.kind === kind).map((r) => r.line);
  const counts = read
    .map((r, i) => ({ ...r, i, parts: r.kind === 'counts' ? countParts(r.line) : [] }))
    .filter((r) => r.kind === 'counts');
  const rowsAt = counts.find((c) => c.parts.some((p) => p.name !== 'Enthaltungen'));
  const usedCounts = rowsAt ? counts.filter((c) => c.i <= rowsAt.i) : counts;
  const lateCounts = new Set(rowsAt ? counts.filter((c) => c.i > rowsAt.i).map((c) => c.i) : []);
  const abstain = usedCounts.flatMap((c) => c.parts).filter((p) => p.name === 'Enthaltungen');
  const parsedRows = (rowsAt?.parts ?? [])
    .filter((p) => p.name !== 'Enthaltungen')
    .map((p) => ({ name: p.name, votes: p.votes, elected: false }));
  const electedRaw = ofKind('elected').map((l) => ELECTION_ELECTED.exec(l)?.[1] ?? '').at(-1);
  const named = electedRaw !== undefined && electedRaw !== 'niemand';
  const hits = named ? electedIndexes(parsedRows, electedRaw) : new Set<number>();
  const rows = parsedRows
    .map((row, i) => ({ ...row, elected: hits.has(i) }))
    .sort((a, b) => b.votes - a.votes || Number(b.elected) - Number(a.elected));
  const others = ofKind('others').at(-1);
  const lot = read.filter((r) => r.kind === 'drawn' || r.kind === 'pending').at(-1)?.kind;
  return {
    meta: lines[metaIndex],
    rows,
    abstentions: abstain.length ? (abstain.at(-1)?.votes ?? null) : null,
    elected:
      named && !parsedRows.length
        ? electedRaw.split(',').map((n) => n.trim()).filter((n) => n)
        : [],
    others: others === undefined ? 0 : Number(ELECTION_OTHERS.exec(others)?.[1]),
    lot: lot === 'drawn' || lot === 'pending' ? lot : null,
    notes: read.filter((r, i) => r.kind === 'note' || lateCounts.has(i)).map((r) => r.line),
  };
}

/** One option row of a poll. */
export interface PollRow {
  readonly label: string;
  /** The votes; for a date poll the Ja answers. */
  readonly count: number;
  /** The Vielleicht answers of a date poll, otherwise null. */
  readonly maybe: number | null;
  /** One of the options with the most votes (several on a tie). */
  readonly top: boolean;
}

/**
 * A poll (Umfrage) in a callout. The backend writes it as
 *
 *     > [!abstimmung] **Frage**
 *     > Umfrage · Mehrfachwahl, höchstens 2
 *     > Freiburg: 7
 *     > Konstanz: 4
 *     > Enthaltungen: 1
 *     > Meiste Stimmen: Freiburg
 *     > 12 Antworten
 *
 * A date poll has the kind "Terminumfrage", rows such as "Di, 3.11. · 18:00–20:00:
 * 5 (+2)" (Ja and Vielleicht), the legend line "Zahl = Ja, (+n) = Vielleicht" and
 * "Bester Termin: …". An open poll has the kind line only. The render service reads
 * the same lines (`_poll` of the typst service).
 */
export interface PollCard {
  readonly kind: 'single' | 'multi' | 'date';
  /** The line "Umfrage · Einzelwahl" or "Terminumfrage". */
  readonly meta: string;
  /** The options in the order of the snippet, best first. */
  readonly rows: readonly PollRow[];
  readonly abstentions: number | null;
  /** "n Antworten" ("1 Antwort"), from the number of the answers line. */
  readonly footer: string | null;
  /** Lines the card does not read. */
  readonly notes: readonly string[];
}

const POLL_META = /^(?:Umfrage\s+·\s+.+|Terminumfrage)$/;
const POLL_ROW = /^(.*\S):\s*(\d+)(?:\s*\(\+(\d+)\))?$/;
const POLL_TOP = /^(?:Meiste Stimmen|Bester Termin):\s*(.*)$/;
const POLL_BALLOTS = /^(\d+) Antwort(?:en)?\b/;
const POLL_LEGEND = 'Zahl = Ja, (+n) = Vielleicht';

/**
 * Split the list of the best options ("A, B") into known labels. A label can hold
 * ", " itself (a date such as "Di, 3.11. · 18:00–20:00"), so the function finds a
 * sequence of known labels that joins to the list, the longer label first.
 */
function topLabels(top: string, labels: readonly string[]): ReadonlySet<string> {
  const ordered = [...new Set(labels)].sort((a, b) => b.length - a.length);
  const failed = new Set<string>();
  const withLabel = (label: string, rest: string): readonly string[] | null => {
    const tail = rest.startsWith(`${label}, `) ? split(rest.slice(label.length + 2)) : null;
    return rest === label ? [label] : tail && [label, ...tail];
  };
  const split = (rest: string): readonly string[] | null => {
    const found = failed.has(rest)
      ? null
      : ordered.reduce<readonly string[] | null>(
          (hit, label) => hit ?? withLabel(label, rest),
          null,
        );
    // A rest that has no split is remembered, so the search tries each rest once.
    if (!found) failed.add(rest);
    return found;
  };
  return new Set(top ? (split(top) ?? []) : []);
}

/** "1 Antwort", "n Antworten". The rest of a stored answers line does not show. */
function answersLine(n: number): string {
  return `${n} ${n === 1 ? 'Antwort' : 'Antworten'}`;
}

/** The kind of one line of a poll callout, the first test that holds wins. */
type PollLineKind = 'top' | 'ballots' | 'legend' | 'abstain' | 'row' | 'note';

/** The kind of one line of a poll callout; a date poll takes only rows with a Vielleicht count. */
function pollLineKind(line: string, date: boolean): PollLineKind {
  const row = POLL_ROW.exec(line);
  const tests: readonly (readonly [PollLineKind, boolean])[] = [
    ['top', POLL_TOP.test(line)],
    ['ballots', !row && POLL_BALLOTS.test(line)],
    ['legend', line === POLL_LEGEND],
    ['abstain', !!row && row[1] === 'Enthaltungen' && row[3] === undefined],
    ['row', !!row && (row[3] !== undefined) === date],
  ];
  return tests.find(([, holds]) => holds)?.[0] ?? 'note';
}

/** Read a poll from the lines after the question. A callout without the kind line is no poll. */
export function parsePoll(lines: readonly string[]): PollCard | null {
  const meta = lines[0];
  if (meta === undefined || !POLL_META.test(meta)) return null;
  const date = meta === 'Terminumfrage';
  const read = lines.slice(1).map((line) => ({ line, kind: pollLineKind(line, date) }));
  const ofKind = (kind: PollLineKind) => read.filter((r) => r.kind === kind).map((r) => r.line);
  const top = ofKind('top').map((l) => (POLL_TOP.exec(l)?.[1] ?? '').trim()).at(-1) ?? '';
  const ballots = ofKind('ballots').at(-1);
  const abstain = ofKind('abstain').at(-1);
  const parsedRows = ofKind('row')
    .map((l) => POLL_ROW.exec(l))
    .filter((row): row is RegExpExecArray => row !== null);
  const best = topLabels(top, parsedRows.map((row) => row[1]));
  return {
    kind: date ? 'date' : meta.includes('Mehrfachwahl') ? 'multi' : 'single',
    meta,
    rows: parsedRows.map((row) => ({
      label: row[1],
      count: Number(row[2]),
      maybe: row[3] !== undefined ? Number(row[3]) : null,
      top: best.has(row[1]),
    })),
    abstentions: abstain === undefined ? null : Number(POLL_ROW.exec(abstain)?.[2]),
    footer: ballots === undefined ? null : answersLine(Number(POLL_BALLOTS.exec(ballots)?.[1])),
    notes: ofKind('note'),
  };
}

/**
 * What the consumer knows about the vote of a callout. The Markdown holds only the
 * question and the counts; the time, the majority rule and the result under that rule
 * come from the consumer, which knows the vote.
 */
export interface VoteCalloutInfo {
  /** The line above the question, for example "Beschluss · 18:52 · Einfache Mehrheit". */
  readonly caption?: string | null;
  /** The result under the majority rule of the vote. A tie is a rejection. */
  readonly result?: { readonly label: string; readonly tone: 'passed' | 'rejected' } | null;
  /** The labels of the counts and of the result, in the language of the page. */
  readonly labels?: {
    readonly yes: string;
    readonly no: string;
    readonly abstain: string;
    readonly result: string;
  } | null;
}

/**
 * Find the info of a callout by its question (the bold text of the marker line). The
 * lines after the question let the consumer tell apart two votes with one question, for
 * example by the kind line of a poll.
 */
export type VoteCalloutResolver = (
  question: string,
  lines?: readonly string[],
) => VoteCalloutInfo | null;

/** The options of the node: a getter, so that a node view reads the current resolver. */
export interface VoteCalloutOptions {
  readonly resolver: () => VoteCalloutResolver | null;
  /** The live node views. The editor renders them again when the resolver changes. */
  readonly views: Set<VoteCalloutView> | null;
}

/** A node view that can render its card again with new info. */
export interface VoteCalloutView {
  render(): void;
}

const DEFAULT_LABELS = { yes: 'Ja', no: 'Nein', abstain: 'Enthaltung', result: 'Ergebnis' };

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The ballot box icon of the caption line (the `vote` icon of the kit). */
function voteIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'mde__voteIcon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.append(
    ...[
      'M7 11V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7',
      'm9.5 7 1.8 1.8L14.5 5.5',
      'M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
      'M8 15h8',
    ].map(svgPath),
  );
  return svg;
}

/** One `path` of an icon. */
function svgPath(d: string): SVGElement {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  return path;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Fill the card of a callout: the caption, the question, the other lines, the counts
 * with the result, and a bar of the counts.
 *
 * Without info the caption is the kind of the callout and no result shows: only the
 * consumer knows the majority rule. `data-result` then keeps the plain count
 * comparison for the styles (`passed`, `rejected`, `tie`, `none`).
 */
function fillCard(root: HTMLElement, raw: string, info: VoteCalloutInfo | null): void {
  const card = parseVoteCallout(raw);
  const labels = info?.labels ?? DEFAULT_LABELS;
  root.replaceChildren();
  root.className = 'mde__vote';
  root.dataset['result'] = info?.result ? info.result.tone : card.result;

  const election = card.tally ? null : parseElection(card.body);
  const poll = card.tally || election ? null : parsePoll(card.body);
  const head = el('div', 'mde__voteHead');
  head.appendChild(voteIcon());
  const kind = card.kind.charAt(0).toUpperCase() + card.kind.slice(1);
  head.appendChild(el('span', 'mde__voteKind', info?.caption || election?.meta || poll?.meta || kind));
  root.appendChild(head);

  if (card.question) root.appendChild(el('div', 'mde__voteQ', card.question));
  if (election) {
    if (info?.result) head.appendChild(el('span', 'mde__voteStatus', info.result.label));
    fillElection(root, election);
    return;
  }
  if (poll) {
    fillPoll(root, poll);
    return;
  }
  root.append(...card.body.map((line) => el('div', 'mde__voteBody', line)));

  if (!card.tally) return;
  const tally = card.tally;
  const keys = Object.keys(TALLY) as (keyof typeof TALLY)[];
  const grid = el('div', 'mde__voteCounts');
  grid.append(
    ...keys.map((key) =>
      withChildren(el('div', 'mde__voteCell'), [
        el('span', 'mde__voteLabel', labels[key]),
        el('span', 'mde__voteNum', String(tally[key])),
      ]),
    ),
  );
  if (info?.result) {
    grid.appendChild(
      withChildren(el('div', 'mde__voteCell mde__voteCell--result'), [
        el('span', 'mde__voteLabel', labels.result),
        el('span', 'mde__voteResult', info.result.label),
      ]),
    );
  }
  root.appendChild(grid);

  const total = tally.yes + tally.no + tally.abstain;
  if (total > 0) {
    const bar = el('div', 'mde__voteBar');
    bar.setAttribute('aria-hidden', 'true');
    bar.append(...keys.filter((key) => tally[key]).map((key) => voteSegment(key, tally[key])));
    root.appendChild(bar);
  }
}

/** Append the children to the node and return the node. */
function withChildren(node: HTMLElement, children: readonly Element[]): HTMLElement {
  node.append(...children);
  return node;
}

/** One part of the bar of the counts, as wide as its count. */
function voteSegment(key: keyof typeof TALLY, votes: number): HTMLElement {
  const part = el('span', `mde__voteSeg mde__voteSeg--${key}`);
  part.style.flexGrow = String(votes);
  return part;
}

/** The check mark of an elected candidate. */
function checkIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  svg.appendChild(path);
  return svg;
}

function markCell(elected: boolean): HTMLElement {
  const cell = el('span', 'mde__elMark');
  if (elected) cell.appendChild(checkIcon());
  return cell;
}

/**
 * The ranking of an election: one row per candidate, best first, with a bar scaled to
 * the best count. A dashed line ends the elected rows. The abstentions come last. The
 * public form has no counts and lists the elected people only.
 */
function fillElection(root: HTMLElement, election: ElectionCard): void {
  root.dataset['election'] = '';
  const list = el('div', 'mde__elRows');
  list.append(...(election.rows.length ? electionRows(election) : publicElectionRows(election)));
  root.appendChild(list);
  if (election.others > 0) {
    root.appendChild(el('div', 'mde__voteBody', `${election.others} weitere Kandidierende`));
  }
  const drawn = election.lot === 'drawn';
  const pending = election.lot === 'pending';
  const tags = [
    ...(drawn ? [el('span', 'mde__elTag', 'Durch Los entschieden')] : []),
    ...(pending ? [el('span', 'mde__elTag mde__elTag--warn', 'Los steht aus')] : []),
  ];
  if (tags.length) root.appendChild(withChildren(el('div', 'mde__elTags'), tags));
  root.append(...election.notes.map((note) => el('div', 'mde__voteBody', note)));
}

/**
 * The rows of an election with counts, best first, and the abstentions last. The dashed
 * line goes before the first row that is not elected and follows an elected one.
 */
function electionRows(election: ElectionCard): readonly HTMLElement[] {
  const top = Math.max(1, ...election.rows.map((r) => r.votes));
  const lineAt = election.rows.findIndex(
    (row, i) => i > 0 && !row.elected && election.rows[i - 1].elected,
  );
  const rows = election.rows.flatMap((row, i) => [
    ...(i === lineAt ? [el('div', 'mde__elLine')] : []),
    electionRow(row, top),
  ]);
  const abstain =
    election.abstentions === null
      ? []
      : [
          withChildren(el('div', 'mde__elRow mde__elRow--abstain'), [
            markCell(false),
            el('span', 'mde__elName', 'Enthaltungen'),
            el('span', 'mde__elTrack mde__elTrack--none'),
            el('span', 'mde__elNum', String(election.abstentions)),
          ]),
        ];
  return [...rows, ...abstain];
}

/** One candidate with its mark, its name, a bar scaled to the best count and its count. */
function electionRow(row: ElectionRow, top: number): HTMLElement {
  const tone = row.elected ? ' mde__elRow--elected' : '';
  const track = el('span', 'mde__elTrack');
  track.setAttribute('aria-hidden', 'true');
  const fill = el('span', 'mde__elFill');
  fill.style.width = `${(row.votes / top) * 100}%`;
  track.appendChild(fill);
  return withChildren(el('div', `mde__elRow${tone}`), [
    markCell(row.elected),
    el('span', 'mde__elName', row.name),
    track,
    el('span', 'mde__elNum', String(row.votes)),
  ]);
}

/** The rows of the public form: the elected people only, without counts. */
function publicElectionRows(election: ElectionCard): readonly HTMLElement[] {
  return election.elected.map((name) =>
    withChildren(el('div', 'mde__elRow mde__elRow--elected mde__elRow--public'), [
      markCell(true),
      el('span', 'mde__elName', name),
    ]),
  );
}

/** The star of the options with the most votes. */
function starIcon(): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z');
  svg.appendChild(path);
  return svg;
}

/**
 * The options of a poll, drawn like the election and like the poll box of the PDF:
 * one row per option in the order of the snippet, a bar scaled to the best count and a
 * star on the best options. A date poll
 * stacks Ja and Vielleicht in one bar, prints "Ja + Vielleicht" and shows a legend
 * of the two parts. The abstentions come last and muted, the line with the number of
 * answers closes the card. An open poll shows its question and its kind only.
 */
function fillPoll(root: HTMLElement, poll: PollCard): void {
  root.dataset['poll'] = poll.kind;
  const date = poll.kind === 'date';
  if (poll.rows.length) {
    const list = el('div', 'mde__elRows mde__pollRows');
    const best = Math.max(1, ...poll.rows.map((r) => r.count + (r.maybe ?? 0)));
    list.append(...poll.rows.map((row) => pollRow(row, best)));
    if (poll.abstentions !== null) {
      list.appendChild(
        withChildren(el('div', 'mde__elRow mde__elRow--abstain'), [
          el('span', 'mde__elMark'),
          el('span', 'mde__elName', 'Enthaltungen'),
          el('span', 'mde__elTrack mde__elTrack--none'),
          el('span', 'mde__elNum', String(poll.abstentions)),
        ]),
      );
    }
    root.appendChild(list);
    if (date) {
      root.appendChild(
        withChildren(el('div', 'mde__pollLegend'), [
          el('span', 'mde__pollSwatch'),
          el('span', '', 'Ja'),
          el('span', 'mde__pollSwatch mde__pollSwatch--maybe'),
          el('span', '', 'Vielleicht'),
        ]),
      );
    }
  }
  root.append(...poll.notes.map((note) => el('div', 'mde__voteBody', note)));
  if (poll.footer) root.appendChild(el('div', 'mde__pollFoot', poll.footer));
}

/** A bar part of a poll row, as wide as its share of the best count. */
function pollFill(className: string, votes: number, best: number): HTMLElement {
  const fill = el('span', className);
  fill.style.width = `${(votes / best) * 100}%`;
  return fill;
}

/** One option of a poll: the star, the label, the bar (Ja, then Vielleicht) and the count. */
function pollRow(row: PollRow, best: number): HTMLElement {
  const mark = el('span', 'mde__elMark');
  if (row.top) mark.appendChild(starIcon());
  const track = el('span', 'mde__elTrack mde__pollTrack');
  track.setAttribute('aria-hidden', 'true');
  track.appendChild(pollFill('mde__elFill', row.count, best));
  if (row.maybe) track.appendChild(pollFill('mde__elFill mde__pollMaybe', row.maybe, best));
  const num = row.maybe === null ? String(row.count) : `${row.count} + ${row.maybe}`;
  return withChildren(el('div', `mde__elRow mde__pollRow${row.top ? ' mde__pollRow--top' : ''}`), [
    mark,
    el('span', 'mde__elName', row.label),
    track,
    el('span', 'mde__elNum', num),
  ]);
}

/** Read the info of a callout from the resolver; a failing resolver gives none. */
function infoFor(resolver: VoteCalloutResolver | null, raw: string): VoteCalloutInfo | null {
  if (!resolver) return null;
  const card = parseVoteCallout(raw);
  try {
    return resolver(card.question, card.body);
  } catch {
    return null;
  }
}

// The parts of markdown-it the block rule touches. The library ships no types of
// its own in this bundle, so the shape is written down here.
interface MdState {
  readonly src: string;
  readonly bMarks: readonly number[];
  readonly eMarks: readonly number[];
  readonly tShift: readonly number[];
  line: number;
  push(type: string, tag: string, nesting: number): { content: string; map: [number, number] | null };
}
interface MarkdownIt {
  readonly block: { readonly ruler: { before(name: string, rule: string, fn: (state: MdState, start: number, end: number, silent: boolean) => boolean, options: { readonly alt: readonly string[] }): void } };
  readonly renderer: { readonly rules: Record<string, (tokens: readonly { readonly content: string }[], idx: number) => string> };
  readonly utils: { escapeHtml(text: string): string };
}

function lineOf(state: MdState, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

/** The first line from `line` on that is no quote line, or `end`. */
function quoteEnd(state: MdState, line: number, end: number): number {
  return line < end && lineOf(state, line).startsWith('>') ? quoteEnd(state, line + 1, end) : line;
}

/** `> [!abstimmung] …` and the quote lines that follow become one `vote_callout` token. */
function voteCalloutRule(state: MdState, startLine: number, endLine: number, silent: boolean): boolean {
  const first = lineOf(state, startLine);
  if (!/^>\s?\[!(abstimmung|vote)\]/i.test(first)) return false;
  if (silent) return true;
  const next = quoteEnd(state, startLine, endLine);
  const lines = Array.from({ length: next - startLine }, (_, i) =>
    lineOf(state, startLine + i).replace(/^>\s?/, ''),
  );
  const token = state.push('vote_callout', 'div', 0);
  token.content = lines.join('\n');
  token.map = [startLine, next];
  state.line = next;
  return true;
}

function voteCalloutPlugin(md: MarkdownIt): void {
  md.block.ruler.before('blockquote', 'vote_callout', voteCalloutRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.renderer.rules['vote_callout'] = (tokens, idx) =>
    `<div data-vote-callout="" data-raw="${md.utils.escapeHtml(tokens[idx].content)}"></div>\n`;
}

interface SerializerState {
  write(text: string): void;
  closeBlock(node: unknown): void;
}

export const VoteCallout = Node.create<VoteCalloutOptions>({
  name: 'voteCallout',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return { resolver: () => null, views: null };
  },

  addAttributes() {
    return { raw: { default: '' } };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vote-callout]',
        getAttrs: (element) => ({ raw: (element as HTMLElement).getAttribute('data-raw') ?? '' }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-vote-callout': '', 'data-raw': HTMLAttributes['raw'] })];
  },

  addNodeView() {
    const options = this.options;
    return ({ node }) => {
      const dom = document.createElement('div');
      const raw = node.attrs['raw'] as string;
      const view: VoteCalloutView = {
        render: () => fillCard(dom, raw, infoFor(options.resolver(), raw)),
      };
      view.render();
      options.views?.add(view);
      return {
        dom,
        update: () => false,
        destroy: () => options.views?.delete(view),
      };
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: SerializerState, node: { attrs: { raw: string } }) {
          const lines = node.attrs.raw.split('\n');
          state.write(lines.map((line) => (line ? `> ${line}` : '>')).join('\n'));
          state.closeBlock(node);
        },
        parse: {
          setup(md: MarkdownIt) {
            voteCalloutPlugin(md);
          },
        },
      },
    };
  },
});
