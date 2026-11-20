import type { Route } from '@angular/router';

/** The axe tags of the e2e sweep of every app. §NF/accessibility/conformance/000491 */
export const AXE_TAGS: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function joinPath(base: string, path: string): string {
  return [base, path].filter((p) => p !== '').join('/');
}

/**
 * Every route path of a router config that shows a page: a route with a component, in the form
 * the config writes it (`applications/:id`). A redirect shows no page of its own.
 * §NF/accessibility/conformance/000491
 */
export function pageRoutes(routes: readonly Route[], base = ''): readonly string[] {
  const all = routes.flatMap((r): readonly string[] => {
    if (r.redirectTo !== undefined) return [];
    const full = joinPath(base, r.path ?? '');
    const own = r.component || r.loadComponent ? [full] : [];
    return [...own, ...pageRoutes(r.children ?? [], full)];
  });
  return [...new Set(all)];
}

/**
 * The gaps between the page routes of an app and the routes of its axe sweep: `missing` has a
 * page without a check, `unknown` a check without a page. Both must be empty.
 * §NF/accessibility/conformance/000491
 */
export function axeRouteGaps(
  routes: readonly Route[],
  swept: Iterable<string>,
): { readonly missing: readonly string[]; readonly unknown: readonly string[] } {
  const pages = pageRoutes(routes);
  const listed = new Set(swept);
  const known = new Set(pages);
  return {
    missing: pages.filter((p) => !listed.has(p)),
    unknown: [...listed].filter((p) => !known.has(p)),
  };
}
