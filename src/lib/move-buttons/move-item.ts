/**
 * Move the item at `index` one step up (`-1`) or down (`1`) and return a new array. At an
 * edge, or with an index outside the list, it returns the list unchanged. The result type
 * is a mutable array, because the apps pass it on to signals of mutable arrays.
 */
export function moveItem<T>(list: readonly T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  return list.map((item, i) => (i === index ? list[target] : i === target ? list[index] : item));
}
