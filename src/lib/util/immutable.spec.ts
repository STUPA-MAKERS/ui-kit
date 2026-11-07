import { assertNever, toggled, withEntry } from './immutable';

describe('immutable helpers', () => {
  it('assertNever throws with the value', () => {
    expect(() => assertNever('x' as never)).toThrow('Unexpected value: x');
  });

  it('toggled adds a missing item and removes a present one, without changing the input', () => {
    const set = new Set([1, 2]);
    expect([...toggled(set, 3)]).toEqual([1, 2, 3]);
    expect([...toggled(set, 1)]).toEqual([2]);
    expect([...set]).toEqual([1, 2]);
  });

  it('withEntry sets a key in a new map', () => {
    const map = new Map([['a', 1]]);
    expect([...withEntry(map, 'b', 2)]).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
    expect(map.size).toBe(1);
  });
});
