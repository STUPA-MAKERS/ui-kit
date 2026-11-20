import type { Routes } from '@angular/router';

/** One showcase page: the route path and the title in the page list. */
export interface ShowcasePage {
  readonly path: string;
  readonly title: string;
}

export const SHOWCASE_PAGES: readonly ShowcasePage[] = [
  { path: 'actions', title: 'Aktionen' },
];

export const SHOWCASE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'actions' },
  {
    path: 'actions',
    loadComponent: () => import('./pages/actions.page').then((m) => m.ActionsPage),
  },
];
