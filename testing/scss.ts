/**
 * Source readers for the specs of the stylesheets. jsdom applies no component styles, so
 * the touch specs of the kit and of the app read the SCSS with these.
 */

/** One use of the press mixins: the rule that holds it and its own `transition`. */
interface PressUse {
  include: string;
  selector: string;
  transition: string | null;
}

/**
 * Every `@include press.press…` of a stylesheet with the selector of its rule and the
 * `transition` that the rule itself declares (not one of a nested rule).
 */
export function pressUses(source: string): PressUse[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const uses: PressUse[] = [];
  for (const m of text.matchAll(/@include press\.(?:press-on|press)(?=[;(])[^;]*;/g)) {
    let depth = 0;
    let open = m.index;
    while (open > 0) {
      open--;
      if (text[open] === '}') depth++;
      else if (text[open] === '{' && depth-- === 0) break;
    }
    const before = text.slice(0, open);
    const selector = before.slice(Math.max(before.lastIndexOf('}'), before.lastIndexOf(';')) + 1).trim();
    let transition: string | null = null;
    depth = 0;
    for (let i = open + 1, start = i; i < text.length; i++) {
      const c = text[i];
      if (c === '{') {
        depth++;
        start = i + 1;
      } else if (c === '}') {
        if (depth-- === 0) break;
        start = i + 1;
      } else if (c === ';') {
        const decl = text.slice(start, i).trim();
        if (depth === 0 && decl.startsWith('transition:')) transition = decl;
        start = i + 1;
      }
    }
    uses.push({ include: m[0], selector, transition });
  }
  return uses;
}
