import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { MEDIA } from '../breakpoints/breakpoints';
import type { TabItem } from '../tabs/tabs.component';
import { drag, mediaMatching } from '../../../testing/touch';
import { SwipeTabsDirective } from './swipe-tabs.directive';

@Component({
  standalone: true,
  imports: [SwipeTabsDirective],
  template: `
    <main>
      <div
        class="host"
        [appSwipeTabs]="tabs"
        [appSwipeTabsActive]="tab()"
        [appSwipeTabsOff]="off()"
        (appSwipeTabsActiveChange)="tab.set($event)"
      >
        @for (t of tabs; track t.id) {
          <section role="tabpanel" [class]="'p-' + t.id" [hidden]="tab() !== t.id">
            <input class="field" />
            <div class="wide" style="overflow-x: auto"></div>
          </section>
        }
      </div>
      <div class="below"></div>
    </main>
  `,
})
class HostComponent {
  readonly tabs: TabItem[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B', disabled: true },
    { id: 'c', label: 'C' },
  ];
  readonly tab = signal('a');
  readonly off = signal(false);
}

const PHONE = [MEDIA.phone, MEDIA.coarse];
const WIDTH = 400;

async function setup(media: readonly string[] = PHONE) {
  mediaMatching(media);
  Object.defineProperty(window, 'innerWidth', { value: WIDTH, configurable: true });
  const view = await render(HostComponent);
  const host = view.fixture.componentInstance;
  const panel = (id: string) => view.container.querySelector(`.p-${id}`) as HTMLElement;
  return { view, host, panel };
}

/** A swipe of `dx` px that starts in the middle of the screen. */
function swipe(target: EventTarget, dx: number, opts: { release?: boolean; dt?: number } = {}) {
  const steps = [0.25, 0.5, 0.75, 1].map((f) => ({ x: 200 + dx * f, y: 300 }));
  return drag(target, { x: 200, y: 300 }, steps, { dt: 100, ...opts });
}

describe('SwipeTabsDirective', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('moves the visible panel with the finger', async () => {
    const { panel } = await setup();
    const moves = swipe(panel('a'), -80, { release: false });
    expect(moves.every((m) => m.defaultPrevented)).toBe(true);
    expect(panel('a').style.left).toBe('-80px');
    expect(panel('a').style.position).toBe('relative');
  });

  it('goes to the next enabled tab past a quarter of the width', async () => {
    const { panel, host, view } = await setup();
    swipe(panel('a'), -120);
    jest.runAllTimers();
    view.fixture.detectChanges();
    expect(host.tab()).toBe('c');
  });

  it('springs back on a short swipe and at the last tab', async () => {
    const { panel, host } = await setup();
    swipe(panel('a'), -40);
    jest.runAllTimers();
    expect(host.tab()).toBe('a');
    expect(panel('a').style.left).toBe('');
    // A swipe to the right on the first tab only resists.
    swipe(panel('a'), 200, { release: false });
    expect(panel('a').style.left).toBe('40px');
  });

  it('takes a swipe on the page below the host', async () => {
    const { view, host } = await setup();
    swipe(view.container.querySelector('.below')!, -200);
    jest.runAllTimers();
    expect(host.tab()).toBe('c');
  });

  it('leaves a field, a sideways scroller and a vertical move alone', async () => {
    const { view, panel, host } = await setup();
    swipe(view.container.querySelector('.p-a .field')!, -200);
    const wide = view.container.querySelector('.p-a .wide') as HTMLElement;
    Object.defineProperty(wide, 'scrollWidth', { value: 800 });
    Object.defineProperty(wide, 'clientWidth', { value: 300 });
    swipe(wide, -200);
    drag(panel('a'), { x: 200, y: 300 }, [{ x: 195, y: 340 }, { x: 100, y: 360 }]);
    jest.runAllTimers();
    expect(host.tab()).toBe('a');
    expect(panel('a').style.left).toBe('');
  });

  it('does nothing without a touch phone, when off, or near the left edge', async () => {
    const { panel, host } = await setup([MEDIA.phone]);
    swipe(panel('a'), -200);
    host.off.set(true);
    jest.runAllTimers();
    expect(host.tab()).toBe('a');
  });

  it('leaves the left edge to the swipe back', async () => {
    const { panel, host } = await setup();
    drag(panel('a'), { x: 10, y: 300 }, [{ x: 60, y: 300 }, { x: 300, y: 300 }]);
    jest.runAllTimers();
    expect(host.tab()).toBe('a');
    expect(panel('a').style.left).toBe('');
  });
});
