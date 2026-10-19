/**
 * Move the item at `index` one step up (`-1`) or down (`1`) and return a new array. At an
 * edge, or with an index outside the list, it returns the list unchanged.
 */
export function moveItem<T>(list: readonly T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
