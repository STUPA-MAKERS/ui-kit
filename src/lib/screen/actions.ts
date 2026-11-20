import type { WidthClass } from '../breakpoints/breakpoints';
import type { Action, HeadSlots } from './screen.types';



/** Where each action of a screen goes. */
export interface ActionPlacement {
  /** Icon buttons in the head button group, in order. */
  readonly head: readonly Action[];
  /** The rows of the ⋮ menu, in order, `danger` last in its group. */
  readonly menu: readonly Action[];
  /** The FABs. */
  readonly fab: readonly Action[];
}

/** The head slots without an override: one on a phone (000197), all on wider screens. */
export const DEFAULT_HEAD_SLOTS: Required<HeadSlots> = {
  phone: 1,
  narrow: Number.POSITIVE_INFINITY,
  wide: Number.POSITIVE_INFINITY,
};

const priority = (a: Action) => a.priority ?? 'menu';

/** Sorts each group so that its danger actions stand last, keeping the order otherwise. */
function dangerLast(actions: readonly Action[]): readonly Action[] {
  const groups = [...new Set(actions.map((a) => a.group ?? ''))];
  return groups.flatMap((g) => {
    const inGroup = actions.filter((a) => (a.group ?? '') === g);
    return [...inGroup.filter((a) => a.kind !== 'danger'), ...inGroup.filter((a) => a.kind === 'danger')];
  });
}

/**
 * Places the actions of a screen for a width. §S/framework/types/002231
 *
 * A `head` action stays in the head while slots are left; `overflow: 'never'` keeps it there
 * and counts against the slots, `overflow: 'always'` sends any action to the ⋮ menu. A `fab`
 * action is a FAB unless `overflow: 'always'`.
 */
export function placeActions(
  actions: readonly Action[],
  width: WidthClass,
  slots: HeadSlots = {},
): ActionPlacement {
  const limit = slots[width] ?? DEFAULT_HEAD_SLOTS[width];
  const isFab = (a: Action) => priority(a) === 'fab' && a.overflow !== 'always';
  const pinned = actions.filter((a) => a.overflow === 'never' && !isFab(a));
  const headAuto = actions.filter((a) => priority(a) === 'head' && (a.overflow ?? 'auto') === 'auto');
  const free = Math.max(0, limit - pinned.length);
  const headKeys = new Set([...pinned, ...headAuto.slice(0, free)].map((a) => a.key));
  return {
    head: actions.filter((a) => headKeys.has(a.key)),
    menu: dangerLast(actions.filter((a) => !headKeys.has(a.key) && !isFab(a))),
    fab: actions.filter(isFab),
  };
}
