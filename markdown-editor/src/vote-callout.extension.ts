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
  kind: string;
  question: string;
  tally: { yes: number; no: number; abstain: number } | null;
  body: string[];
  result: 'passed' | 'rejected' | 'tie' | 'none';
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
  name: string;
  votes: number;
  elected: boolean;
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
  meta: string;
  /** The candidates, best first, the elected first within equal votes. */
  rows: ElectionRow[];
  abstentions: number | null;
  /** The elected people of the public form, which has no counts. */
  elected: string[];
  others: number;
  lot: 'drawn' | 'pending' | null;
  /** Lines the card does not read (a runoff note of an older election). */
  notes: string[];
}

const ELECTION_META = /^(?:Wahl|Stichwahl)\b.*·\s*\d+\s+Posten/;

/**
 * Read an election from the lines after the question. A callout without the line
 * "Wahl · n Posten", or with a single candidate (its Ja/Nein line), is no ranking.
 */
export function parseElection(lines: readonly string[]): ElectionCard | null {
  const metaIndex = lines.findIndex((l) => ELECTION_META.test(l));
  if (metaIndex < 0 || lines.some((l) => /^Kandidatur:/.test(l))) return null;
  const card: ElectionCard = {
    meta: lines[metaIndex],
    rows: [],
    abstentions: null,
    elected: [],
    others: 0,
    lot: null,
    notes: [],
  };
  let electedRaw: string | null = null;
  for (const [i, line] of lines.entries()) {
    if (i === metaIndex) continue;
    const elected = /^Gewählt:\s*(.*)$/.exec(line);
    const others = /^(\d+) weitere Kandidierende$/.exec(line);
    if (elected) electedRaw = elected[1];
    else if (others) card.others = Number(others[1]);
    else if (line === 'Durch Los entschieden.') card.lot = 'drawn';
    else if (/^Gleichstand: das Los steht aus\.?$/.test(line)) card.lot = 'pending';
    else if (/^.+:\s*\d+(\s+·\s+.+:\s*\d+)*$/.test(line) && !card.rows.length) {
      for (const part of line.split(/\s+·\s+/)) {
        const match = /^(.*):\s*(\d+)$/.exec(part);
        if (!match) continue;
        if (match[1] === 'Enthaltungen') card.abstentions = Number(match[2]);
        else card.rows.push({ name: match[1], votes: Number(match[2]), elected: false });
      }
    } else card.notes.push(line);
  }
  if (electedRaw !== null && electedRaw !== 'niemand') {
    // Match the known names first, so a name with ", " stays whole.
    let rest = electedRaw;
    const known = [...card.rows].sort((a, b) => b.name.length - a.name.length);
    for (const row of known) {
      if (rest.includes(row.name)) {
        row.elected = true;
        rest = rest.replace(row.name, '');
      }
    }
    if (!card.rows.length) {
      card.elected = electedRaw.split(',').map((n) => n.trim()).filter((n) => n);
    }
  }
  card.rows.sort((a, b) => b.votes - a.votes || Number(b.elected) - Number(a.elected));
  return card;
}

/** One option row of a poll. */
export interface PollRow {
  label: string;
  /** The votes; for a date poll the Ja answers. */
  count: number;
  /** The Vielleicht answers of a date poll, otherwise null. */
  maybe: number | null;
  /** One of the options with the most votes (several on a tie). */
  top: boolean;
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
  kind: 'single' | 'multi' | 'date';
  /** The line "Umfrage · Einzelwahl" or "Terminumfrage". */
  meta: string;
  /** The options in the order of the snippet, best first. */
  rows: PollRow[];
  abstentions: number | null;
  /** "n Antworten" ("1 Antwort"), from the number of the answers line. */
  footer: string | null;
  /** Lines the card does not read. */
  notes: string[];
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
function topLabels(top: string, labels: readonly string[]): Set<string> {
  const ordered = [...new Set(labels)].sort((a, b) => b.length - a.length);
  const failed = new Set<string>();
  const split = (rest: string): string[] | null => {
    if (failed.has(rest)) return null;
    for (const label of ordered) {
      if (rest === label) return [label];
      if (rest.startsWith(`${label}, `)) {
        const tail = split(rest.slice(label.length + 2));
        if (tail) return [label, ...tail];
      }
    }
    failed.add(rest);
    return null;
  };
  return new Set(top ? (split(top) ?? []) : []);
}

/** "1 Antwort", "n Antworten". The rest of a stored answers line does not show. */
function answersLine(n: number): string {
  return `${n} ${n === 1 ? 'Antwort' : 'Antworten'}`;
}

/** Read a poll from the lines after the question. A callout without the kind line is no poll. */
export function parsePoll(lines: readonly string[]): PollCard | null {
  const meta = lines[0];
  if (meta === undefined || !POLL_META.test(meta)) return null;
  const date = meta === 'Terminumfrage';
  const card: PollCard = {
    kind: date ? 'date' : meta.includes('Mehrfachwahl') ? 'multi' : 'single',
    meta,
    rows: [],
    abstentions: null,
    footer: null,
    notes: [],
  };
  let top = '';
  for (const line of lines.slice(1)) {
    const topMatch = POLL_TOP.exec(line);
    const row = POLL_ROW.exec(line);
    if (topMatch) top = topMatch[1].trim();
    else if (!row && POLL_BALLOTS.test(line)) card.footer = answersLine(Number(POLL_BALLOTS.exec(line)?.[1]));
    else if (line === POLL_LEGEND) continue;
    else if (row && row[1] === 'Enthaltungen' && row[3] === undefined) card.abstentions = Number(row[2]);
    else if (row && (row[3] !== undefined) === date) {
      card.rows.push({
        label: row[1],
        count: Number(row[2]),
        maybe: row[3] !== undefined ? Number(row[3]) : null,
        top: false,
      });
    } else card.notes.push(line);
  }
  const best = topLabels(top, card.rows.map((r) => r.label));
  for (const row of card.rows) row.top = best.has(row.label);
  return card;
}

/**
 * What the consumer knows about the vote of a callout. The Markdown holds only the
 * question and the counts; the time, the majority rule and the result under that rule
 * come from the consumer, which knows the vote.
 */
export interface VoteCalloutInfo {
  /** The line above the question, for example "Beschluss · 18:52 · Einfache Mehrheit". */
  caption?: string | null;
  /** The result under the majority rule of the vote. A tie is a rejection. */
  result?: { label: string; tone: 'passed' | 'rejected' } | null;
  /** The labels of the counts and of the result, in the language of the page. */
  labels?: { yes: string; no: string; abstain: string; result: string } | null;
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
  resolver: () => VoteCalloutResolver | null;
  /** The live node views. The editor renders them again when the resolver changes. */
  views: Set<VoteCalloutView> | null;
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
  for (const d of [
    'M7 11V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7',
    'm9.5 7 1.8 1.8L14.5 5.5',
    'M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    'M8 15h8',
  ]) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
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
  for (const line of card.body) root.appendChild(el('div', 'mde__voteBody', line));

  if (!card.tally) return;
  const tally = card.tally;
  const keys = Object.keys(TALLY) as (keyof typeof TALLY)[];
  const grid = el('div', 'mde__voteCounts');
  for (const key of keys) {
    const cell = el('div', 'mde__voteCell');
    cell.appendChild(el('span', 'mde__voteLabel', labels[key]));
    cell.appendChild(el('span', 'mde__voteNum', String(tally[key])));
    grid.appendChild(cell);
  }
  if (info?.result) {
    const cell = el('div', 'mde__voteCell mde__voteCell--result');
    cell.appendChild(el('span', 'mde__voteLabel', labels.result));
    cell.appendChild(el('span', 'mde__voteResult', info.result.label));
    grid.appendChild(cell);
  }
  root.appendChild(grid);

  const total = tally.yes + tally.no + tally.abstain;
  if (total > 0) {
    const bar = el('div', 'mde__voteBar');
    bar.setAttribute('aria-hidden', 'true');
    for (const key of keys) {
      if (!tally[key]) continue;
      const part = el('span', `mde__voteSeg mde__voteSeg--${key}`);
      part.style.flexGrow = String(tally[key]);
      bar.appendChild(part);
    }
    root.appendChild(bar);
  }
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
  if (election.rows.length) {
    const top = Math.max(1, ...election.rows.map((r) => r.votes));
    let lineDone = false;
    for (const [i, row] of election.rows.entries()) {
      if (!row.elected && !lineDone && i > 0 && election.rows[i - 1].elected) {
        list.appendChild(el('div', 'mde__elLine'));
        lineDone = true;
      }
      const tone = row.elected ? ' mde__elRow--elected' : '';
      const line = el('div', `mde__elRow${tone}`);
      line.appendChild(markCell(row.elected));
      line.appendChild(el('span', 'mde__elName', row.name));
      const track = el('span', 'mde__elTrack');
      track.setAttribute('aria-hidden', 'true');
      const fill = el('span', 'mde__elFill');
      fill.style.width = `${(row.votes / top) * 100}%`;
      track.appendChild(fill);
      line.appendChild(track);
      line.appendChild(el('span', 'mde__elNum', String(row.votes)));
      list.appendChild(line);
    }
    if (election.abstentions !== null) {
      const line = el('div', 'mde__elRow mde__elRow--abstain');
      line.appendChild(markCell(false));
      line.appendChild(el('span', 'mde__elName', 'Enthaltungen'));
      line.appendChild(el('span', 'mde__elTrack mde__elTrack--none'));
      line.appendChild(el('span', 'mde__elNum', String(election.abstentions)));
      list.appendChild(line);
    }
  } else {
    for (const name of election.elected) {
      const line = el('div', 'mde__elRow mde__elRow--elected mde__elRow--public');
      line.appendChild(markCell(true));
      line.appendChild(el('span', 'mde__elName', name));
      list.appendChild(line);
    }
  }
  root.appendChild(list);
  if (election.others > 0) {
    root.appendChild(el('div', 'mde__voteBody', `${election.others} weitere Kandidierende`));
  }
  const tags: HTMLElement[] = [];
  if (election.lot === 'drawn') tags.push(el('span', 'mde__elTag', 'Durch Los entschieden'));
  if (election.lot === 'pending') {
    tags.push(el('span', 'mde__elTag mde__elTag--warn', 'Los steht aus'));
  }
  if (tags.length) {
    const box = el('div', 'mde__elTags');
    for (const tag of tags) box.appendChild(tag);
    root.appendChild(box);
  }
  for (const note of election.notes) root.appendChild(el('div', 'mde__voteBody', note));
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
    for (const row of poll.rows) {
      const line = el('div', `mde__elRow mde__pollRow${row.top ? ' mde__pollRow--top' : ''}`);
      const mark = el('span', 'mde__elMark');
      if (row.top) mark.appendChild(starIcon());
      line.appendChild(mark);
      line.appendChild(el('span', 'mde__elName', row.label));
      const track = el('span', 'mde__elTrack mde__pollTrack');
      track.setAttribute('aria-hidden', 'true');
      const fill = el('span', 'mde__elFill');
      fill.style.width = `${(row.count / best) * 100}%`;
      track.appendChild(fill);
      if (row.maybe) {
        const maybe = el('span', 'mde__elFill mde__pollMaybe');
        maybe.style.width = `${(row.maybe / best) * 100}%`;
        track.appendChild(maybe);
      }
      line.appendChild(track);
      const num = row.maybe === null ? String(row.count) : `${row.count} + ${row.maybe}`;
      line.appendChild(el('span', 'mde__elNum', num));
      list.appendChild(line);
    }
    if (poll.abstentions !== null) {
      const line = el('div', 'mde__elRow mde__elRow--abstain');
      line.appendChild(el('span', 'mde__elMark'));
      line.appendChild(el('span', 'mde__elName', 'Enthaltungen'));
      line.appendChild(el('span', 'mde__elTrack mde__elTrack--none'));
      line.appendChild(el('span', 'mde__elNum', String(poll.abstentions)));
      list.appendChild(line);
    }
    root.appendChild(list);
    if (date) {
      const legend = el('div', 'mde__pollLegend');
      legend.appendChild(el('span', 'mde__pollSwatch'));
      legend.appendChild(el('span', '', 'Ja'));
      legend.appendChild(el('span', 'mde__pollSwatch mde__pollSwatch--maybe'));
      legend.appendChild(el('span', '', 'Vielleicht'));
      root.appendChild(legend);
    }
  }
  for (const note of poll.notes) root.appendChild(el('div', 'mde__voteBody', note));
  if (poll.footer) root.appendChild(el('div', 'mde__pollFoot', poll.footer));
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
  src: string;
  bMarks: number[];
  eMarks: number[];
  tShift: number[];
  line: number;
  push(type: string, tag: string, nesting: number): { content: string; map: [number, number] | null };
}
interface MarkdownIt {
  block: { ruler: { before(name: string, rule: string, fn: (state: MdState, start: number, end: number, silent: boolean) => boolean, options: { alt: string[] }): void } };
  renderer: { rules: Record<string, (tokens: { content: string }[], idx: number) => string> };
  utils: { escapeHtml(text: string): string };
}

function lineOf(state: MdState, line: number): string {
  return state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);
}

/** `> [!abstimmung] …` and the quote lines that follow become one `vote_callout` token. */
function voteCalloutRule(state: MdState, startLine: number, endLine: number, silent: boolean): boolean {
  const first = lineOf(state, startLine);
  if (!/^>\s?\[!(abstimmung|vote)\]/i.test(first)) return false;
  if (silent) return true;
  let next = startLine;
  const lines: string[] = [];
  while (next < endLine) {
    const line = lineOf(state, next);
    if (!line.startsWith('>')) break;
    lines.push(line.replace(/^>\s?/, ''));
    next++;
  }
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
