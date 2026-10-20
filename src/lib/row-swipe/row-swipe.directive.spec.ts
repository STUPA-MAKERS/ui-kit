import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { MEDIA } from '../breakpoints/breakpoints';
import { ListItemComponent } from '../list-item/list-item.component';
import { drag, mediaMatching, touch } from '../../../testing/touch';
import type { RowSwipeAction } from './row-swipe.directive';

const ARCHIVE: RowSwipeAction = { id: 'archive', label: 'Archivieren', icon: 'archive', leaves: true };
const SHARE: RowSwipeAction = { id: 'share', label: 'Öffentliche Links', icon: 'link' };

@Component({
  standalone: true,
  imports: [ListItemComponent],
  template: `
    @if (shown()) {
      <app-list-item
        title="Druckkosten"
        [swipeRight]="right()"
        [swipeLeft]="left()"
        (swiped)="done.push($event.id)"
        (activate)="opened = opened + 1"
      />
    }
  `,
})
class HostComponent {
  readonly right = signal<RowSwipeAction | null>(SHARE);
  readonly left = signal<RowSwipeAction | null>(ARCHIVE);
  readonly shown = signal(true);
  readonly done: string[] = [];
  opened = 0;
}

const PHONE = [MEDIA.phone, MEDIA.coarse];

async function setup(media: readonly string[] = PHONE) {
  mediaMatching(media);
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
  const view = await render(HostComponent);
  const frame = view.container.querySelector('.li-sw') as HTMLElement;
  const fg = view.container.querySelector('.li') as HTMLElement;
  const plate = (side: 'left' | 'right') =>
    view.container.querySelector(`.li-sw__plate--${side}`) as HTMLElement | null;
  return { view, frame, fg, plate, host: view.fixture.componentInstance };
}

describe('RowSwipeDirective in app-list-item', () => {
  let vibrate: jest.Mock;
  beforeEach(() => {
    jest.useFakeTimers();
    vibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (navigator as { vibrate?: unknown }).vibrate;
  });

  it('moves the row and shows the plate of the direction, armed past 40 %', async () => {
    const { frame, fg, plate, view } = await setup();
    const moves = drag(frame, { x: 200, y: 20 }, [{ x: 180, y: 21 }, { x: 100, y: 22 }], { release: false });
    view.fixture.detectChanges();
    expect(moves.every((m) => m.defaultPrevented)).toBe(true);
    expect(fg.style.transform).toBe('translateX(-100px)');
    expect(frame).toHaveClass('row-swipe--drag');
    expect(plate('left')).toHaveClass('li-sw__plate--on');
    expect(plate('left')).not.toHaveClass('li-sw__plate--armed');
    expect(plate('right')).not.toHaveClass('li-sw__plate--on');
    expect(plate('left')?.textContent).toContain('Archivieren');
    touch(frame, 'touchmove', [{ x: 60, y: 22 }]);
    view.fixture.detectChanges();
    expect(plate('left')).toHaveClass('li-sw__plate--armed');
    expect(vibrate).toHaveBeenCalledTimes(1);
    // Back below the threshold and out again: a second tick.
    touch(frame, 'touchmove', [{ x: 150, y: 22 }]);
    touch(frame, 'touchmove', [{ x: 50, y: 22 }]);
    expect(vibrate).toHaveBeenCalledTimes(2);
  });

  it('slides a leaving row out, closes its height, then emits', async () => {
    const { frame, fg, host, view } = await setup();
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 100, y: 20 }]);
    expect(fg.style.transform).toBe('translateX(-300px)');
    expect(fg.style.transition).toContain('transform 280ms');
    expect(host.done).toEqual([]);
    jest.advanceTimersByTime(280);
    expect(frame.style.height).toBe('0px');
    expect(frame.style.transition).toContain('height 200ms');
    jest.advanceTimersByTime(200);
    expect(host.done).toEqual(['archive']);
    // The page takes the row out.
    host.shown.set(false);
    view.fixture.detectChanges();
    jest.advanceTimersByTime(2000);
  });

  it('brings a leaving row back when the page keeps it', async () => {
    const { frame, fg, host } = await setup();
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 100, y: 20 }]);
    jest.advanceTimersByTime(480 + 1200);
    expect(host.done).toEqual(['archive']);
    expect(frame.style.height).toBe('');
    expect(fg.style.transform).toBe('');
    expect(frame).not.toHaveClass('row-swipe--drag');
  });

  it('springs back and emits at once for an action that stays, and swallows the click', async () => {
    const { frame, fg, host } = await setup();
    drag(frame, { x: 20, y: 20 }, [{ x: 40, y: 20 }, { x: 200, y: 20 }]);
    expect(host.done).toEqual(['share']);
    expect(fg.style.transform).toBe('');
    (frame.querySelector('.li__title') as HTMLElement).click();
    expect(host.opened).toBe(0);
    jest.advanceTimersByTime(400);
    (frame.querySelector('.li__title') as HTMLElement).click();
    expect(host.opened).toBe(1);
  });

  it('springs back below the threshold, and ignores a touch while it settles', async () => {
    const { frame, fg, host } = await setup();
    drag(frame, { x: 20, y: 20 }, [{ x: 40, y: 20 }, { x: 100, y: 20 }]);
    drag(frame, { x: 20, y: 20 }, [{ x: 40, y: 20 }, { x: 250, y: 20 }]);
    jest.advanceTimersByTime(280);
    expect(host.done).toEqual([]);
    expect(fg.style.transform).toBe('');
  });

  it('does not move to a side without an action', async () => {
    const { frame, fg, host, view } = await setup();
    host.right.set(null);
    view.fixture.detectChanges();
    drag(frame, { x: 20, y: 20 }, [{ x: 40, y: 20 }, { x: 250, y: 20 }]);
    expect(fg.style.transform).toBe('');
    jest.advanceTimersByTime(280);
    expect(host.done).toEqual([]);
  });

  it('leaves a vertical scroll alone and a cancel springs back', async () => {
    const { frame, fg, host } = await setup();
    const moves = drag(frame, { x: 20, y: 20 }, [{ x: 21, y: 25 }, { x: 22, y: 80 }]);
    expect(moves.some((m) => m.defaultPrevented)).toBe(false);
    drag(frame, { x: 200, y: 20 }, [{ x: 180, y: 20 }, { x: 20, y: 20 }], { release: false });
    touch(frame, 'touchmove', [{ x: 1, y: 1 }, { x: 2, y: 2 }]);
    jest.advanceTimersByTime(280);
    expect(host.done).toEqual([]);
    expect(fg.style.transform).toBe('');
  });

  it('fades the row out with reduced motion', async () => {
    const { frame, fg, host } = await setup([...PHONE, MEDIA.reducedMotion]);
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 100, y: 20 }]);
    expect(fg.style.opacity).toBe('0');
    expect(fg.style.transform).toBe('translateX(-150px)');
    jest.advanceTimersByTime(200);
    expect(host.done).toEqual(['archive']);
  });

  it('does nothing on a desktop, without actions, with two fingers or under a modal', async () => {
    const { frame, host, view } = await setup([]);
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 10, y: 20 }]);
    mediaMatching(PHONE);
    touch(frame, 'touchstart', [{ x: 1, y: 1 }, { x: 5, y: 5 }]);
    touch(frame, 'touchmove', [{ x: 200, y: 1 }]);
    const modal = document.createElement('div');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 10, y: 20 }]);
    modal.remove();
    host.left.set(null);
    host.right.set(null);
    view.fixture.detectChanges();
    drag(frame, { x: 250, y: 20 }, [{ x: 230, y: 20 }, { x: 10, y: 20 }]);
    touch(frame, 'touchend', []);
    jest.advanceTimersByTime(2000);
    expect(host.done).toEqual([]);
  });
});
