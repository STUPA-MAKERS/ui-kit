import type { Routes } from '@angular/router';
import { listDetailRoutes, provideFramework, screenRoute } from '@stupa-makers/ui-kit/shell';

import { demoConfig } from './demo/demo-config';
import {
  DemoAboutPage,
  DemoApplyPage,
  DemoSettingsListPage,
  DemoSettingsPage,
  DemoPublicListPage,
  DemoDetailPage,
  DemoEditPage,
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
        children: [{ path: ':id/edit', component: DemoEditPage }],
        none: {
          icon: 'file',
          heading: 'Antrag wählen',
          emptyHeading: 'Keine Anträge',
        },
      }),
      screenRoute({ path: 'form', title: 'Formular', component: DemoFormPage }),
      screenRoute({ path: 'apply', title: 'Antrag stellen', component: DemoApplyPage }),
      listDetailRoutes({
        path: 'settings',
        title: 'Einstellungen',
        list: DemoSettingsListPage,
        detail: DemoSettingsPage,
        none: { icon: 'gear', heading: 'Einstellung wählen', emptyHeading: 'Keine Einstellungen' },
      }),
      screenRoute({
        path: 'protocols',
        title: 'Öffentliche Protokolle',
        component: DemoPublicListPage,
        frame: 'public',
        footer: true,
      }),
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
