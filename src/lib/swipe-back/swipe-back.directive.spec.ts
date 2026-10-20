import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { MEDIA } from '../breakpoints/breakpoints';
import { takeGestureNavigation } from '../gesture/gesture';
import { drag, mediaMatching, touch } from '../../../testing/touch';
import { SwipeBackDirective } from './swipe-back.directive';

@Component({
  standalone: true,
  imports: [SwipeBackDirective],
  template: `
    <div #under class="under"></div>
    <div
      class="page"
      appSwipeBack
      [appSwipeBackOff]="off()"
      [appSwipeBackUnder]="withUnder() ? under : null"
      (appSwipeBackStart)="events.push('start')"
      (appSwipeBack)="events.push('back')"
      (appSwipeBackEnd)="events.push('end')"
    ></div>
  `,
})
class HostComponent {
  readonly off = signal(false);
  readonly withUnder = signal(true);
  readonly events: string[] = [];
}

const PHONE = [MEDIA.phone, MEDIA.coarse];
const WIDTH = 400;

async function setup(media: readonly string[] = PHONE) {
  mediaMatching(media);
  Object.defineProperty(window, 'innerWidth', { value: WIDTH, configurable: true });
  const view = await render(HostComponent);
  const page = view.container.querySelector('.page') as HTMLElement;
  const under = view.container.querySelector('.under') as HTMLElement;
  return { view, page, under, host: view.fixture.componentInstance };
}

describe('SwipeBackDirective', () => {
  let vibrate: jest.Mock;
  beforeEach(() => {
    jest.useFakeTimers();
    vibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    takeGestureNavigation();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (navigator as { vibrate?: unknown }).vibrate;
    document.body.innerHTML = '';
  });

  it('moves the page with the finger and the under layer with parallax and scrim', async () => {
    const { page, under, host } = await setup();
    const moves = drag(page, { x: 10, y: 300 }, [{ x: 30, y: 301 }, { x: 110, y: 302 }], {
      release: false,
    });
    expect(host.events).toEqual(['start']);
    expect(moves.every((m) => m.defaultPrevented)).toBe(true);
    expect(page.style.left).toBe('100px');
    expect(page.style.transition).toBe('none');
    // p = 0.25: the list goes from -25 % to 0, so it is at -75 px.
    expect(under.style.left).toBe('-75px');
    expect(under.style.getPropertyValue('--swipe-back-scrim')).toBe('0.75');
    expect(under.style.getPropertyValue('--swipe-back-duration')).toBe('0ms');
  });

  it('goes back past 35 % of the width, with one tick at the threshold', async () => {
    const { page, under, host, view } = await setup();
    drag(page, { x: 10, y: 300 }, [{ x: 100, y: 300 }, { x: 160, y: 300 }, { x: 120, y: 300 }, { x: 170, y: 300 }], {
      dt: 400,
    });
    // Out at 150 px (37.5 %), in at 110, out again at 160: one tick per crossing.
    expect(vibrate).toHaveBeenCalledTimes(2);
    expect(vibrate).toHaveBeenCalledWith(10);
    expect(page.style.left).toBe(`${WIDTH}px`);
    expect(page.style.transition).toContain('left 280ms var(--ease-enter)');
    expect(under.style.left).toBe('0px');
    expect(host.events).toEqual(['start']);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'back']);
    expect(takeGestureNavigation()).toBe(true);
    // The page closes the detail: the styles go without a motion.
    host.off.set(true);
    view.fixture.detectChanges();
    expect(host.events).toEqual(['start', 'back', 'end']);
    expect(page.style.left).toBe('');
    expect(under.style.left).toBe('');
    expect(under.style.getPropertyValue('--swipe-back-scrim')).toBe('');
  });

  it('goes back on a fast flick below the distance', async () => {
    const { page, host } = await setup();
    drag(page, { x: 5, y: 300 }, [{ x: 20, y: 300 }, { x: 60, y: 300 }, { x: 100, y: 300 }], { dt: 20 });
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'back']);
  });

  it('springs back on a slow short release', async () => {
    const { page, under, host } = await setup();
    drag(page, { x: 5, y: 300 }, [{ x: 20, y: 300 }, { x: 80, y: 300 }], { dt: 500 });
    expect(page.style.left).toBe('0px');
    expect(under.style.left).toBe(`${-0.25 * WIDTH}px`);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'end']);
    expect(page.style.left).toBe('');
  });

  it('springs back when the page does not close within a second', async () => {
    const { page, host } = await setup();
    drag(page, { x: 5, y: 300 }, [{ x: 200, y: 300 }]);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'back']);
    jest.advanceTimersByTime(1000);
    expect(page.style.left).toBe('0px');
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'back', 'end']);
  });

  it('springs back on a touch cancel, a second finger and when it turns off', async () => {
    const { page, host, view } = await setup();
    drag(page, { x: 5, y: 300 }, [{ x: 100, y: 300 }], { release: false });
    touch(page, 'touchcancel', []);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'end']);

    drag(page, { x: 5, y: 300 }, [{ x: 100, y: 300 }], { release: false });
    touch(page, 'touchmove', [{ x: 120, y: 300 }, { x: 200, y: 300 }]);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'end', 'start', 'end']);

    drag(page, { x: 5, y: 300 }, [{ x: 100, y: 300 }], { release: false });
    host.off.set(true);
    view.fixture.detectChanges();
    jest.advanceTimersByTime(280);
    expect(host.events.slice(-2)).toEqual(['start', 'end']);
    touch(page, 'touchend', []);
    expect(host.events.length).toBe(6);
  });

  it('leaves a scroll alone: a vertical or a leftward move, and a start away from the edge', async () => {
    const { page, host } = await setup();
    const vertical = drag(page, { x: 10, y: 300 }, [{ x: 12, y: 290 }, { x: 14, y: 200 }]);
    expect(vertical.some((m) => m.defaultPrevented)).toBe(false);
    drag(page, { x: 20, y: 300 }, [{ x: 5, y: 300 }]);
    const far = drag(page, { x: 40, y: 300 }, [{ x: 200, y: 300 }]);
    expect(far[0].defaultPrevented).toBe(false);
    expect(host.events).toEqual([]);
    expect(page.style.left).toBe('');
  });

  it('keeps a small move to the right from a native pan before the lock', async () => {
    const { page, host } = await setup();
    const [right] = drag(page, { x: 10, y: 300 }, [{ x: 14, y: 301 }], { release: false });
    expect(right.defaultPrevented).toBe(true);
    const [up] = drag(page, { x: 10, y: 300 }, [{ x: 11, y: 296 }], { release: false });
    expect(up.defaultPrevented).toBe(false);
    touch(page, 'touchend', []);
    expect(host.events).toEqual([]);
  });

  it.each([
    ['a desktop', [] as string[]],
    ['a phone width with a mouse', [MEDIA.phone]],
  ])('does nothing on %s', async (_, media) => {
    const { page, host } = await setup(media);
    drag(page, { x: 5, y: 300 }, [{ x: 200, y: 300 }]);
    jest.advanceTimersByTime(1000);
    expect(host.events).toEqual([]);
  });

  it('does nothing while off, with two fingers, or while a modal layer is open', async () => {
    const { page, host, view } = await setup();
    touch(page, 'touchstart', [{ x: 5, y: 1 }, { x: 50, y: 1 }]);
    touch(page, 'touchmove', [{ x: 100, y: 1 }]);
    const sheet = document.createElement('div');
    sheet.setAttribute('aria-modal', 'true');
    document.body.appendChild(sheet);
    drag(page, { x: 5, y: 300 }, [{ x: 200, y: 300 }]);
    sheet.remove();
    host.off.set(true);
    view.fixture.detectChanges();
    drag(page, { x: 5, y: 300 }, [{ x: 200, y: 300 }]);
    expect(host.events).toEqual([]);
  });

  it('settles at once with reduced motion, and the under layer does not move', async () => {
    const { page, under, host } = await setup([...PHONE, MEDIA.reducedMotion]);
    drag(page, { x: 5, y: 300 }, [{ x: 100, y: 300 }], { release: false });
    expect(under.style.left).toBe('0px');
    touch(page, 'touchmove', [{ x: 300, y: 300 }]);
    touch(page, 'touchend', []);
    expect(page.style.transition).toBe('none');
    expect(host.events).toEqual(['start', 'back']);
  });

  it('works without an under layer, and ignores a touch during a settle', async () => {
    const { page, host, view } = await setup();
    host.withUnder.set(false);
    view.fixture.detectChanges();
    drag(page, { x: 5, y: 300 }, [{ x: 50, y: 300 }], { dt: 500 });
    drag(page, { x: 5, y: 300 }, [{ x: 300, y: 300 }]);
    jest.advanceTimersByTime(280);
    expect(host.events).toEqual(['start', 'end']);
  });

  it('removes its listeners when it is destroyed', async () => {
    const { page, view } = await setup();
    const spy = jest.spyOn(page, 'removeEventListener');
    view.fixture.destroy();
    const types = spy.mock.calls.map(([type]) => type);
    expect(types).toEqual(expect.arrayContaining(['touchstart', 'touchmove', 'touchend', 'touchcancel']));
  });
});
