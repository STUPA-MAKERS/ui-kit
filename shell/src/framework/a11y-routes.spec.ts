import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Routes } from '@angular/router';

import { axeRouteGaps, pageRoutes } from './a11y-routes';

@Component({ changeDetection: ChangeDetectionStrategy.Eager, standalone: true, template: '' })
class Page {}

const ROUTES: Routes = [
  {
    path: '',
    component: Page,
    children: [
      { path: 'old', redirectTo: 'applications' },
      {
        path: 'applications',
        loadComponent: () => Promise.resolve(Page),
        children: [
          { path: '', component: Page },
          { path: ':id', component: Page },
        ],
      },
      { path: 'group', children: [{ path: 'inner', component: Page }] },
    ],
  },
];

// §NF/accessibility/conformance/000491
describe('pageRoutes', () => {
  it('lists every route with a page once, without redirects and empty groups', () => {
    expect(pageRoutes(ROUTES)).toEqual(['', 'applications', 'applications/:id', 'group/inner']);
  });
});

describe('axeRouteGaps', () => {
  it('names the pages without a check and the checks without a page', () => {
    expect(axeRouteGaps(ROUTES, ['', 'applications', 'gone'])).toEqual({
      missing: ['applications/:id', 'group/inner'],
      unknown: ['gone'],
    });
  });

  it('is empty when the sweep covers the app', () => {
    expect(axeRouteGaps(ROUTES, pageRoutes(ROUTES))).toEqual({ missing: [], unknown: [] });
  });
});
