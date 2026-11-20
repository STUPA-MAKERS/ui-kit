import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { placeActions } from './actions';
import { loadedData, toLoadState } from './load-state';
import type { Action } from './screen.types';

const a = (key: string, extra: Partial<Action> = {}): Action => ({ key, label: key, icon: 'more', ...extra });

describe('placeActions §S/framework/types/002231', () => {
  const actions: readonly Action[] = [
    a('edit', { priority: 'head' }),
    a('share', { priority: 'head' }),
    a('delete', { priority: 'menu', kind: 'danger' }),
    a('export', { priority: 'menu' }),
    a('new', { priority: 'fab', kind: 'main' }),
  ];

  it('keeps one head action on a phone and every head action on wider screens', () => {
    expect(placeActions(actions, 'phone').head.map((x) => x.key)).toEqual(['edit']);
    expect(placeActions(actions, 'phone').menu.map((x) => x.key)).toEqual(['share', 'export', 'delete']);
    expect(placeActions(actions, 'wide').head.map((x) => x.key)).toEqual(['edit', 'share']);
    expect(placeActions(actions, 'narrow').fab.map((x) => x.key)).toEqual(['new']);
  });

  it('takes the head slots of the screen as an override', () => {
    expect(placeActions(actions, 'phone', { phone: 0 }).head).toEqual([]);
    expect(placeActions(actions, 'wide', { wide: 1 }).head.map((x) => x.key)).toEqual(['edit']);
  });

  it('follows the overflow of one action', () => {
    const list = [a('edit', { priority: 'head' }), a('pin', { priority: 'menu', overflow: 'never' }), a('x', { priority: 'head', overflow: 'always' }), a('f', { priority: 'fab', overflow: 'always' })];
    const phone = placeActions(list, 'phone');
    expect(phone.head.map((x) => x.key)).toEqual(['pin']);
    expect(phone.menu.map((x) => x.key)).toEqual(['edit', 'x', 'f']);
    expect(phone.fab).toEqual([]);
  });

  it('puts the danger actions last in their menu group', () => {
    const list = [a('d', { kind: 'danger', group: 'g' }), a('n', { group: 'g' }), a('o', { group: 'h' })];
    expect(placeActions(list, 'wide').menu.map((x) => x.key)).toEqual(['n', 'd', 'o']);
  });
});

describe('toLoadState §S/framework/state/002220', () => {
  const make = () => {
    const value = signal<readonly string[] | undefined>(undefined);
    const isLoading = signal(true);
    const error = signal<unknown>(undefined);
    const reload = jest.fn();
    const state = TestBed.runInInjectionContext(() =>
      toLoadState({ value, isLoading, error, reload }, { empty: { heading: 'Leer', icon: 'file' }, error: 'Fehler' }),
    );
    return { value, isLoading, error, reload, state };
  };

  it('walks through loading, ready, empty and error', () => {
    const s = make();
    expect(s.state()).toEqual({ state: 'loading' });
    s.value.set(['a']);
    s.isLoading.set(false);
    expect(s.state()).toEqual({ state: 'ready', data: ['a'], more: false });
    s.isLoading.set(true);
    expect(s.state()).toEqual({ state: 'loading', previous: ['a'] });
    expect(loadedData(s.state())).toEqual(['a']);
    s.isLoading.set(false);
    s.value.set([]);
    expect(s.state()).toMatchObject({ state: 'empty', heading: 'Leer' });
    s.error.set(new Error('x'));
    const err = s.state();
    expect(err.state).toBe('error');
    if (err.state === 'error') err.retry();
    expect(s.reload).toHaveBeenCalled();
    expect(loadedData(err)).toBeUndefined();
  });
});
