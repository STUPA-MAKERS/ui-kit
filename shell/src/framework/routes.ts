import type { Type } from '@angular/core';
import type { CanMatchFn, Route, Routes } from '@angular/router';
import { leaveUnsaved } from '@stupa-makers/ui-kit';

import { ListNoneComponent, type ListNoneData } from '../list-none/list-none.component';

/** A component, or a loader of it for a lazy chunk (`() => import('./x').then((m) => m.X)`). */
export type ScreenComponent = Type<unknown> | (() => Promise<Type<unknown>>);

function load(c: ScreenComponent): () => Promise<Type<unknown>> {
  return isLoader(c) ? c : () => Promise.resolve(c);
}

function isLoader(c: ScreenComponent): c is () => Promise<Type<unknown>> {
  return !Object.prototype.hasOwnProperty.call(c, 'prototype');
}

/** The route data key that asks the shell to move the focus to the `h1` (000512). */
export const FOCUS_H1 = 'focusH1';

/** Options of {@link listDetailRoutes}. §S/framework/shell/002262 */
export interface ListDetailRouteOptions {
  readonly path: string;
  readonly title: string;
  readonly list: ScreenComponent;
  readonly detail: ScreenComponent;
  /** The route parameter of the open row. Default `id`. */
  readonly param?: string;
  readonly children?: Routes;
  readonly canMatch?: readonly CanMatchFn[];
  /** The texts of the empty detail pane. */
  readonly none?: ListNoneData;
}

/** Options of {@link screenRoute}. §S/framework/shell/002262 */
export interface ScreenRouteOptions {
  readonly path: string;
  readonly title: string;
  readonly component: ScreenComponent;
  readonly frame?: 'rail' | 'public' | 'bare';
  readonly footer?: boolean;
  readonly canMatch?: readonly CanMatchFn[];
}

/**
 * The route of a list/detail page: the list, the empty detail route and the detail of the
 * open row, each with the title and the focus move. The route motion follows from the path.
 * §S/framework/shell/002262 §S/framework/config/002224
 */
export function listDetailRoutes(o: ListDetailRouteOptions): Route {
  return {
    path: o.path,
    title: o.title,
    ...(o.canMatch ? { canMatch: [...o.canMatch] } : {}),
    data: { [FOCUS_H1]: true },
    loadComponent: load(o.list),
    children: [
      {
        path: '',
        component: ListNoneComponent,
        ...(o.none ? { data: { none: o.none } } : {}),
      },
      ...(o.children ?? []).map((r) => withLeaveGuard(r)),
      {
        path: `:${o.param ?? 'id'}`,
        loadComponent: load(o.detail),
        canDeactivate: [leaveUnsaved],
        data: { [FOCUS_H1]: true },
      },
    ],
  };
}

/**
 * The route of any other screen, with the title, the focus move and the frame data of the
 * shell (`chrome: false` for `bare`, `footer`). §S/framework/shell/002262
 */
export function screenRoute(o: ScreenRouteOptions): Route {
  return {
    path: o.path,
    title: o.title,
    ...(o.canMatch ? { canMatch: [...o.canMatch] } : {}),
    data: {
      [FOCUS_H1]: true,
      ...(o.frame === 'bare' ? { chrome: false } : {}),
      ...(o.frame === 'public' ? { frame: 'public' } : {}),
      ...(o.footer ? { footer: true } : {}),
    },
    canDeactivate: [leaveUnsaved],
    loadComponent: load(o.component),
  };
}

/** A route of the app that may hold a form screen asks before it leaves unsaved changes. */
function withLeaveGuard(r: Route): Route {
  return { ...r, canDeactivate: [...(r.canDeactivate ?? []), leaveUnsaved] };
}
