import type { Routes } from '@angular/router';
import { listDetailRoutes, provideFramework, screenRoute } from '@stupa-makers/ui-kit/shell';

import { demoConfig } from './demo/demo-config';
import {
  DemoAboutPage,
  DemoDetailPage,
  DemoFormPage,
  DemoFrame,
  DemoListPage,
  DemoStartPage,
} from './demo/demo-pages';

/** One showcase page: the route path and the title in the page list. */
export interface ShowcasePage {
  readonly path: string;
  readonly title: string;
}

export const SHOWCASE_PAGES: readonly ShowcasePage[] = [
  { path: 'actions', title: 'Aktionen' },
  { path: 'demo', title: 'Framework-Shell' },
];

export const SHOWCASE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'actions' },
  {
    path: 'actions',
    loadComponent: () => import('./pages/actions.page').then((m) => m.ActionsPage),
  },
  {
    path: 'demo',
    component: DemoFrame,
    providers: [provideFramework(demoConfig())],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'start' },
      screenRoute({ path: 'start', title: 'Start', component: DemoStartPage }),
      listDetailRoutes({
        path: 'applications',
        title: 'Anträge',
        list: DemoListPage,
        detail: DemoDetailPage,
        none: {
          icon: 'file',
          heading: 'Antrag wählen',
          emptyHeading: 'Keine Anträge',
        },
      }),
      screenRoute({ path: 'form', title: 'Formular', component: DemoFormPage }),
      screenRoute({
        path: 'about',
        title: 'Über',
        component: DemoAboutPage,
        frame: 'public',
        footer: true,
      }),
    ],
  },
];
