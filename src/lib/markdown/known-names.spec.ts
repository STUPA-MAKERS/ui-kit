import { MASK, matchKnownName, type KnownName } from './known-names';

const NAMES: readonly KnownName[] = [
  { first: 'Anna', last: 'Hoffmann' },
  { first: 'Anna', last: 'Hofer' },
  { first: 'Max', last: 'Weber' },
];

/** The marked text of a line, or null. */
function marked(text: string): string | null {
  const m = matchKnownName(text, NAMES);
  return m ? text.slice(m.from, m.to) : null;
}

describe('matchKnownName (000969)', () => {
  it('marks a known full name in any case after a space or a punctuation mark', () => {
    expect(marked('Es spricht anna HOFFMANN ')).toBe('anna HOFFMANN');
    expect(marked('Anna Hofer.')).toBe('Anna Hofer');
    expect(marked('Max  Weber,')).toBe('Max  Weber');
  });

  it('marks the first name at the first character that fits no last name', () => {
    expect(marked('Anna s')).toBe('Anna');
    expect(marked('Anna Hoff')).toBeNull();
    expect(marked('Anna Hofx')).toBe('Anna');
    expect(marked('Anna Hof ')).toBe('Anna');
  });

  it('marks the first name before a punctuation mark, not before a space', () => {
    expect(marked('sagt Anna,')).toBe('Anna');
    expect(marked('Anna ')).toBeNull();
    expect(marked('Annas.')).toBeNull();
  });

  it('marks nothing again after an undo, in masked text or without names', () => {
    expect(marked('Anna sa')).toBeNull();
    expect(marked(`${MASK}Anna.`)).toBeNull();
    expect(marked('Anna Hoffmannx y')).toBeNull();
    expect(matchKnownName('Anna Hoffmann ', [])).toBeNull();
    expect(matchKnownName('', NAMES)).toBeNull();
    expect(marked('Otto Weber ')).toBeNull();
    expect(marked('Otto.')).toBeNull();
  });
});
