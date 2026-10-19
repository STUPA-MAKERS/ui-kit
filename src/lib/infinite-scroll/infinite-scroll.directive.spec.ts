import { render } from '@testing-library/angular';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

describe('InfiniteScrollDirective', () => {
  const g = globalThis as { IntersectionObserver?: unknown };
  const original = g.IntersectionObserver;
  let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
  const options: IntersectionObserverInit[] = [];
  const observed: Element[] = [];
  const disconnect = jest.fn();

  beforeEach(() => {
    fire = null;
    options.length = 0;
    observed.length = 0;
    disconnect.mockClear();
    g.IntersectionObserver = class {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void, opts: IntersectionObserverInit) {
        fire = cb;
        options.push(opts);
      }
      observe(el: Element): void {
        observed.push(el);
      }
      disconnect = disconnect;
    };
  });
  afterEach(() => (g.IntersectionObserver = original));

  it('fires when the sentinel comes into view, and stops with it', async () => {
    const reached = jest.fn();
    const view = await render(
      `<div #box><div class="end" appInfiniteScroll [scrollRoot]="box" (scrolledToEnd)="reached()"></div></div>`,
      { imports: [InfiniteScrollDirective], componentProperties: { reached } },
    );
    const end = view.container.querySelector('.end');
    expect(observed).toEqual([end]);
    expect(options[0]).toEqual({ root: end?.parentElement, rootMargin: '400px' });
    fire?.([{ isIntersecting: false }]);
    expect(reached).not.toHaveBeenCalled();
    fire?.([{ isIntersecting: true }]);
    expect(reached).toHaveBeenCalledTimes(1);
    view.fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('does nothing without IntersectionObserver', async () => {
    delete g.IntersectionObserver;
    const reached = jest.fn();
    await render(`<div appInfiniteScroll scrollMargin="0px" (scrolledToEnd)="reached()"></div>`, {
      imports: [InfiniteScrollDirective],
      componentProperties: { reached },
    });
    expect(reached).not.toHaveBeenCalled();
  });
});
