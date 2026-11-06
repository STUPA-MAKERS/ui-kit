/** A piece of a text, and whether it matches the query. */
export interface TextPart {
  readonly text: string;
  readonly hit: boolean;
}

/**
 * Split a text into the parts that match the query and the parts that do not, without
 * regard to case. Every match is marked, so "Radhaus" and "Lastenrad" both show "rad".
 * An empty query gives the whole text as one plain part.
 */
export function highlight(text: string, query: string): readonly TextPart[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q || !text) return [{ text, hit: false }];
  const lower = text.toLocaleLowerCase();
  // A locale lowering that changes the length (rare, for example "İ") would shift every
  // index after it. Then the text stays plain rather than marking the wrong letters.
  if (lower.length !== text.length) return [{ text, hit: false }];
  // The split finds the matches left to right without overlap; a match ends every piece but
  // the last.
  const pieces = lower.split(q);
  return pieces.reduce<{ readonly at: number; readonly parts: readonly TextPart[] }>(
    (acc, piece, i) => {
      const end = acc.at + piece.length;
      const plain = piece ? [{ text: text.slice(acc.at, end), hit: false }] : [];
      const hit = i < pieces.length - 1 ? [{ text: text.slice(end, end + q.length), hit: true }] : [];
      return { at: end + q.length, parts: [...acc.parts, ...plain, ...hit] };
    },
    { at: 0, parts: [] },
  ).parts;
}
