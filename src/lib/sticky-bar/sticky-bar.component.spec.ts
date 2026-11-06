import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { StickyBarComponent, scrollParent, watchSiblings } from './sticky-bar.component';

@Component({
  standalone: true,
  imports: [StickyBarComponent],
  template: `<app-sticky-bar [sticky]="sticky()"><input aria-label="Suche" /></app-sticky-bar>`,
})
class Host {
  readonly sticky = signal(true);
}

/** The bar in a box that scrolls by itself (the body of the admin sheet). */
@Component({
  standalone: true,
  imports: [StickyBarComponent],
  template: `<div class="pane" style="overflow-y: auto; padding-top: 32px">
    <app-sticky-bar><input aria-label="Suche" /></app-sticky-bar>
  </div>`,
})
class PaneHost {}

/** jsdom lays nothing out, so the box of the bar is stated directly. */
function place(el: HTMLElement, top: number, height = 60): void {
  el.getBoundingClientRect = () =>
    ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top }) as DOMRect;
}

function scrollTo(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
}

/** Run the measure that a scroll schedules for the next frame. */
async function flushFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve));
}

async function setup() {
  const view = await render(Host);
  const bar = view.container.querySelector('app-sticky-bar') as HTMLElement;
  return { view, bar };
}

describe('StickyBarComponent', () => {
  afterEach(() => {
    scrollTo(0);
    document.documentElement.style.removeProperty('scroll-padding-top');
  });

  it('projects its content', async () => {
    const { bar } = await setup();
    expect(bar.querySelector('input')).not.toBeNull();
  });

  it('is not stuck while the page is at the top', async () => {
    const { bar } = await setup();
    place(bar, 120);
    scrollTo(0);
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    expect(bar.classList.contains('stb--stuck')).toBe(false);
  });

  it('is stuck when the page scrolled and the bar sits at its offset', async () => {
    const { bar, view } = await setup();
    place(bar, 0);
    scrollTo(400);
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    view.fixture.detectChanges();
    expect(bar.classList.contains('stb--stuck')).toBe(true);

    // Back at the top: the bar is at its place in the flow again.
    place(bar, 120);
    scrollTo(0);
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    view.fixture.detectChanges();
    expect(bar.classList.contains('stb--stuck')).toBe(false);
  });

  it('keeps the focus scroll clear of the bar and removes the padding when it goes', async () => {
    const { bar, view } = await setup();
    place(bar, 0, 64);
    window.dispatchEvent(new Event('resize'));
    await flushFrame();
    expect(document.documentElement.style.getPropertyValue('scroll-padding-top')).toBe('64px');

    view.fixture.destroy();
    expect(document.documentElement.style.getPropertyValue('scroll-padding-top')).toBe('');
  });

  it('turned off, it never sticks and sets no padding', async () => {
    const { bar, view } = await setup();
    view.fixture.componentInstance.sticky.set(false);
    view.fixture.detectChanges();
    place(bar, 0);
    scrollTo(400);
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    view.fixture.detectChanges();
    expect(bar.classList.contains('stb--off')).toBe(true);
    expect(bar.classList.contains('stb--stuck')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('scroll-padding-top')).toBe('');
  });

  it('an off bar does not remove the padding that another bar set', async () => {
    const { bar, view } = await setup();
    place(bar, 0, 64);
    window.dispatchEvent(new Event('resize'));
    await flushFrame();
    // Another bar on the page owns the padding now.
    document.documentElement.style.setProperty('scroll-padding-top', '80px');
    view.fixture.componentInstance.sticky.set(false);
    view.fixture.detectChanges();
    await flushFrame();
    // This bar set a padding before, so it removes it once; a second off measure must not.
    document.documentElement.style.setProperty('scroll-padding-top', '80px');
    window.dispatchEvent(new Event('scroll'));
    await flushFrame();
    expect(document.documentElement.style.getPropertyValue('scroll-padding-top')).toBe('80px');
  });

  describe('in a box that scrolls by itself', () => {
    async function setupPane() {
      const view = await render(PaneHost);
      const pane = view.container.querySelector('.pane') as HTMLElement;
      const bar = view.container.querySelector('app-sticky-bar') as HTMLElement;
      pane.getBoundingClientRect = () =>
        ({ top: 24, height: 800, bottom: 824, left: 0, right: 0, width: 0, x: 0, y: 24 }) as DOMRect;
      return { view, pane, bar };
    }

    it('finds the box as its scroll container', async () => {
      const { pane, bar } = await setupPane();
      expect(scrollParent(bar)).toBe(pane);
    });

    it('is stuck when the box scrolled and the bar sits at the top of the box, also with the window at the top', async () => {
      const { view, pane, bar } = await setupPane();
      // The box starts at 24 and has a top padding of 32: the bar sticks at 56.
      place(bar, 56);
      Object.defineProperty(pane, 'scrollTop', { value: 200, writable: true, configurable: true });
      pane.dispatchEvent(new Event('scroll'));
      await flushFrame();
      view.fixture.detectChanges();
      expect(bar).toHaveClass('stb--stuck');
    });

    it('puts the focus scroll padding on the box, not on the document, and removes it', async () => {
      const { view, pane, bar } = await setupPane();
      place(bar, 24, 56);
      pane.dispatchEvent(new Event('scroll'));
      await flushFrame();
      // 32 (the top padding of the box) + 56 (the bar).
      expect(pane.style.getPropertyValue('scroll-padding-top')).toBe('88px');
      expect(document.documentElement.style.getPropertyValue('scroll-padding-top')).toBe('');
      view.fixture.destroy();
      expect(pane.style.getPropertyValue('scroll-padding-top')).toBe('');
    });
  });
});

describe('watchSiblings', () => {
  function column(): { pane: HTMLElement; bar: HTMLElement; rows: HTMLElement } {
    const pane = document.createElement('div');
    pane.className = 'ld-pane';
    const bar = document.createElement('div');
    bar.className = 'ld-pane__filters';
    const rows = document.createElement('div');
    pane.append(bar, rows);
    return { pane, bar, rows };
  }
  const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  it('reports a class change of a sibling and of a sibling added later', async () => {
    const { pane, bar, rows } = column();
    const changed = jest.fn();
    const observer = watchSiblings(bar, changed);
    rows.classList.add('rows--scroll');
    await flush();
    expect(changed).toHaveBeenCalledTimes(1);

    const later = document.createElement('div');
    pane.append(later);
    await flush();
    later.classList.add('rows--scroll');
    await flush();
    expect(changed).toHaveBeenCalledTimes(3);
    observer?.disconnect();
  });

  it('ignores the class of the bar itself, and a bar outside a list column', async () => {
    const { bar } = column();
    const changed = jest.fn();
    const observer = watchSiblings(bar, changed);
    bar.classList.add('stb--stuck');
    await flush();
    expect(changed).not.toHaveBeenCalled();
    observer?.disconnect();

    const lone = document.createElement('div');
    lone.className = 'ld-pane__filters';
    document.createElement('div').append(lone);
    expect(watchSiblings(lone, changed)).toBeNull();
  });
});
