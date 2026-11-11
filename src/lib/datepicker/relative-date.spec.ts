import { resolveRelativeDate } from './relative-date';

/** §000700 §000702 shortcuts relative to today, month-end stop, left to right. */
describe('resolveRelativeDate', () => {
  const today = new Date(2026, 10, 11); // 11.11.2026

  it.each([
    ['+1w', '2026-11-18'],
    ['-1d', '2026-11-10'],
    ['+1y', '2027-11-11'],
    ['+1m-2d', '2026-12-09'],
    ['+ 2 W', '2026-11-25'],
    ['+3t', '2026-11-14'],
    ['-1j', '2025-11-11'],
    ['+0d', '2026-11-11'],
    ['+25d', '2026-12-06'],
    ['-11m', '2025-12-11'],
  ])('resolves %s', (text, iso) => {
    expect(resolveRelativeDate(text, today)).toBe(iso);
  });

  it.each(['', '1w', '+1', '+w', '+1x', '+1w+', 'heute', '24.12.2026', '+12345d', '-9999y'])(
    'rejects %p',
    (text) => {
      expect(resolveRelativeDate(text, today)).toBe('');
    },
  );

  it('stops a month step at the end of the month (000702)', () => {
    expect(resolveRelativeDate('+1m', new Date(2026, 0, 31))).toBe('2026-02-28');
    expect(resolveRelativeDate('+1y', new Date(2028, 1, 29))).toBe('2029-02-28');
    expect(resolveRelativeDate('-1m', new Date(2026, 2, 31))).toBe('2026-02-28');
  });

  it('applies the terms from left to right', () => {
    const jan31 = new Date(2026, 0, 31);
    expect(resolveRelativeDate('+1m-2d', jan31)).toBe('2026-02-26');
    expect(resolveRelativeDate('-2d+1m', jan31)).toBe('2026-02-28');
  });

  it('uses the current date by default', () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(resolveRelativeDate('+0d')).toBe(iso);
  });
});
