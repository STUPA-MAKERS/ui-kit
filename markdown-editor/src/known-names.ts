/**
 * The automatic blackout of known names (specs 000969, 000970). Plain functions without
 * Tiptap, so the formatted view and the Markdown source of the app share them.
 *
 * The caller gives the text of the line up to the cursor, with the character that the
 * person just typed as the last character. Text that must not get a marker (a marked
 * segment, code, a marker itself) is replaced with `MASK` of the same length, so the
 * offsets stay the same.
 */

/** A known name: the first and the last word of the name of a person. */
export interface KnownName {
  readonly first: string;
  readonly last: string;
}

/** The range of the line text that gets the marker, end exclusive. */
export interface NameMatch {
  readonly from: number;
  readonly to: number;
}

/** The stand-in for a character that must not get a marker. */
export const MASK = '\u0000';

/** A character of a word: a letter, a digit or a hyphen. */
const WORD_CHAR = /[\p{L}\p{N}-]/u;
/** A space between the first and the last name (no line break). */
const GAP = '[ \\t\\u00a0]+';
const WORD = '[\\p{L}\\p{N}-]+';
/** The start of a word: the line start or a character that is no word character and no mask. */
const LEAD = '(^|[^\\p{L}\\p{N}\\-\\u0000])';
const PAIR_RE = new RegExp(`${LEAD}(${WORD})${GAP}(${WORD})$`, 'u');
const SINGLE_RE = new RegExp(`${LEAD}(${WORD})$`, 'u');

const fold = (s: string): string => s.toLocaleLowerCase();

/** The last names of each first name, compared without case. */
function lastNames(names: readonly KnownName[]): ReadonlyMap<string, readonly string[]> {
  const out = new Map<string, string[]>();
  for (const { first, last } of names) {
    const key = fold(first);
    out.set(key, [...(out.get(key) ?? []), fold(last)]);
  }
  return out;
}

/** True if one of the last names starts with the text. */
const fits = (lasts: readonly string[], text: string): boolean =>
  lasts.some((l) => l.startsWith(text));

/**
 * The range that gets the marker after the last typed character, or `null`.
 *
 * - A known full name followed by a character that is no word character: the full name.
 * - A known first name with a second word that just stopped to fit any last name of
 *   that first name (a deviating character, or the end of the word): the first name.
 * - A known first name followed directly by a character that is no word character and
 *   no space: the first name.
 *
 * A first name gets its marker only at the character that makes the second word
 * deviate, so after an undo the next character does not set the marker again.
 */
export function matchKnownName(text: string, names: readonly KnownName[]): NameMatch | null {
  if (!text || names.length === 0) return null;
  const typed = text[text.length - 1];
  const lasts = lastNames(names);
  if (WORD_CHAR.test(typed)) {
    const m = PAIR_RE.exec(text);
    const known = m ? lasts.get(fold(m[2])) : undefined;
    if (!m || !known) return null;
    const second = fold(m[3]);
    if (fits(known, second) || !fits(known, second.slice(0, -1))) return null;
    const from = m.index + m[1].length;
    return { from, to: from + m[2].length };
  }
  const before = text.slice(0, -1);
  const pair = PAIR_RE.exec(before);
  const known = pair ? lasts.get(fold(pair[2])) : undefined;
  if (pair && known) {
    const from = pair.index + pair[1].length;
    const second = fold(pair[3]);
    if (known.includes(second)) return { from, to: before.length };
    if (fits(known, second)) return { from, to: from + pair[2].length };
  }
  if (/\s/u.test(typed)) return null;
  const single = SINGLE_RE.exec(before);
  if (!single || !lasts.has(fold(single[2]))) return null;
  const from = single.index + single[1].length;
  return { from, to: before.length };
}
