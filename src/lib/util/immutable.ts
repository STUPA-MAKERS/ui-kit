/**
 * Helpers for the functional style.
 *
 * `assertNever` closes an exhaustive `switch`. `toggled` and `withEntry` build a new
 * collection instead of changing one in place, so a signal `.update()` gets a pure function.
 */

/** Closes an exhaustive `switch`: the compiler fails when a case is missing. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

/** Returns a new set with `item` added when it is absent and removed when it is present. */
export const toggled = <T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> =>
  new Set(set.has(item) ? [...set].filter((x) => x !== item) : [...set, item]);

/** Returns a new map with `key` set to `value`. */
export const withEntry = <K, V>(map: ReadonlyMap<K, V>, key: K, value: V): ReadonlyMap<K, V> =>
  new Map([...map, [key, value]]);
