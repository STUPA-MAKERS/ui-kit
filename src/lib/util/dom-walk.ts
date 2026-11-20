/**
 * Walks through the DOM as arrays, so a search over the ancestors or the siblings of an
 * element is a `find` or a `some`.
 */

/** The ancestors of `el`, the parent first, up to the root element. */
export function ancestors(el: Element): readonly HTMLElement[] {
  const parent = el.parentElement;
  return parent ? [parent, ...ancestors(parent)] : [];
}

/** The element siblings after `el`, the next one first. */
export function nextSiblings(el: Element): readonly Element[] {
  const next = el.nextElementSibling;
  return next ? [next, ...nextSiblings(next)] : [];
}
