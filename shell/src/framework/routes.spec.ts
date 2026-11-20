import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Type } from '@angular/core';
import type { Route } from '@angular/router';

import { ListNoneComponent } from '../list-none/list-none.component';
import { FOCUS_H1, listDetailRoutes, screenRoute } from './routes';

@Component({ changeDetection: ChangeDetectionStrategy.Eager, standalone: true, template: '' })
class ListPage {}
@Component({ changeDetection: ChangeDetectionStrategy.Eager, standalone: true, template: '' })
class DetailPage {}

async function loaded(route: Route | undefined): Promise<Type<unknown>> {
  const load = route?.loadComponent as () => Promise<Type<unknown>>;
  return load();
}

// §S/framework/shell/002262
describe('listDetailRoutes', () => {
  const route = listDetailRoutes({
    path: 'applications',
    title: 'Anträge',
    list: ListPage,
    detail: () => Promise.resolve(DetailPage),
  });

  it('sets the title and the focus move', () => {
    expect(route.path).toBe('applications');
    expect(route.title).toBe('Anträge');
    expect(route.data?.[FOCUS_H1]).toBe(true);
  });

  it('adds the empty detail route and the detail by id', async () => {
    const [none, detail] = route.children ?? [];
    expect(none?.path).toBe('');
    expect(none?.component).toBe(ListNoneComponent);
    expect(detail?.path).toBe(':id');
    expect(await loaded(detail)).toBe(DetailPage);
    expect(await loaded(route)).toBe(ListPage);
  });

  it('takes another parameter and extra children before the detail', () => {
    const other = listDetailRoutes({
      path: 'x',
      title: 'X',
      list: ListPage,
      detail: DetailPage,
      param: 'key',
      children: [{ path: 'new', component: DetailPage }],
    });
    expect(other.children?.map((c) => c.path)).toEqual(['', 'new', ':key']);
  });
});

describe('screenRoute', () => {
  it('turns the frame off for bare and asks for the footer', async () => {
    const route = screenRoute({
      path: 'beamer',
      title: 'Beamer',
      component: ListPage,
      frame: 'bare',
      footer: true,
    });
    expect(route.data).toEqual({ [FOCUS_H1]: true, chrome: false, footer: true });
    expect(await loaded(route)).toBe(ListPage);
  });

  it('marks a public screen', () => {
    const route = screenRoute({ path: 'p', title: 'P', component: ListPage, frame: 'public' });
    expect(route.data?.['frame']).toBe('public');
  });
});
