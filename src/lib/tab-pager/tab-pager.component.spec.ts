import { Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import type { TabItem } from '../tabs/tabs.component';
import { TabPageDirective } from './tab-page.directive';
import { TabPagerComponent } from './tab-pager.component';

const TABS: TabItem[] = [
  { id: 'a', label: 'Offen', count: 2 },
  { id: 'b', label: 'In Arbeit' },
  { id: 'c', label: 'Wartet' },
  { id: 'd', label: 'Erledigt' },
];

@Component({
  standalone: true,
  imports: [TabPagerComponent, TabPageDirective],
  template: `
    <app-tab-pager ariaLabel="Board" idPrefix="tp" [tabs]="tabs()" [(active)]="tab" [paged]="paged()" [fill]="fill()">
      <ng-template appTabPage="a"><p>Seite A</p></ng-template>
      <ng-template appTabPage let-id let-active="active">
        <p [attr.data-active]="active">Seite {{ id }}</p>
      </ng-template>
    </app-tab-pager>
  `,
})
class Host {
  tabs = signal<TabItem[]>(TABS);
  tab = signal<string | null>('a');
  paged = signal(true);
  fill = signal(false);
}

const rect = (left: number, width: number, height = 44) =>
  ({ left, right: left + width, width, top: 0, bottom: height, height }) as DOMRect;

async function setup(init: Partial<{ paged: boolean; fill: boolean; tab: string | null; tabs: TabItem[] }> = {}) {
  const view = await render(Host);
  const host = view.fixture.componentInstance;
  if (init.paged !== undefined) host.paged.set(init.paged);
  if (init.fill !== undefined) host.fill.set(init.fill);
  if (init.tab !== undefined) host.tab.set(init.tab);
  if (init.tabs) host.tabs.set(init.tabs);
  view.fixture.detectChanges();
  await view.fixture.whenStable();
  const el = view.container.querySelector('app-tab-pager') as HTMLElement;
  const pager = el.querySelector('.tp__pager') as HTMLElement;
  const cmp = view.fixture.debugElement.children[0].componentInstance as TabPagerComponent;
  return { ...view, host, el, pager, cmp };
}

function layOut(pager: HTMLElement, width: number): jest.Mock {
  Object.defineProperty(pager, 'clientWidth', { configurable: true, value: width });
  const scrollTo = jest.fn();
  pager.scrollTo = scrollTo as unknown as typeof pager.scrollTo;
  return scrollTo;
}

describe('TabPagerComponent', () => {
  it('paged: one page per tab side by side, each a tab panel of its tab', async () => {
    const { el, container } = await setup();
    expect(el).toHaveClass('tp--paged');
    const pages = Array.from(container.querySelectorAll<HTMLElement>('.tp__page'));
    expect(pages.map((p) => p.textContent?.trim())).toEqual(['Seite A', 'Seite b', 'Seite c', 'Seite d']);
    const tab = screen.getByRole('tab', { name: /Offen/ });
    expect(pages[0]).toHaveAttribute('role', 'tabpanel');
    expect(pages[0].id).toBe(tab.getAttribute('aria-controls'));
    expect(pages[0]).toHaveAttribute('aria-labelledby', tab.id);
    // The pages beside the active one are there to see during a swipe, but not to use.
    expect(pages[0]).not.toHaveAttribute('inert');
    expect(pages[1]).toHaveAttribute('inert');
    expect(pages[1].querySelector('p')).toHaveAttribute('data-active', 'false');
    expect(container.querySelector('.tp__ink')).not.toBeNull();
  });

  it('not paged: the page of the active tab, the others hidden in the DOM', async () => {
    const { el, container, host, fixture } = await setup({ paged: false });
    expect(el).not.toHaveClass('tp--paged');
    expect(container.querySelector('.tp__pager')).toBeNull();
    const panels = Array.from(container.querySelectorAll<HTMLElement>('.tp__panel'));
    expect(panels.map((p) => p.hidden)).toEqual([false, true, true, true]);
    fireEvent.click(screen.getByRole('tab', { name: 'Wartet' }));
    fixture.detectChanges();
    expect(host.tab()).toBe('c');
    expect(panels.map((p) => p.hidden)).toEqual([true, true, false, true]);
  });

  it('opens the first enabled tab when the active one is unknown or disabled', async () => {
    const { cmp } = await setup({ tab: 'nope', tabs: [{ ...TABS[0], disabled: true }, ...TABS.slice(1)] });
    expect(cmp.current()).toBe('b');
    expect(cmp.index()).toBe(1);
  });

  it('has no active tab without tabs', async () => {
    const { cmp } = await setup({ tabs: [] });
    expect(cmp.current()).toBeNull();
    expect(cmp.index()).toBe(0);
    expect(cmp.templateFor('x')).not.toBeNull();
  });

  it('fill: the host takes the height and each page scrolls by itself', async () => {
    const { el } = await setup({ fill: true });
    expect(el).toHaveClass('tp--fill');
  });

  it('scrolls the pager to a tapped tab and follows a swipe', async () => {
    const { cmp, host, fixture, pager } = await setup();
    const scrollTo = layOut(pager, 390);
    fireEvent.click(screen.getByRole('tab', { name: 'Wartet' }));
    expect(scrollTo).toHaveBeenCalledWith({ left: 780, behavior: 'smooth' });
    // On the way to a tapped tab, the tabs between do not light up.
    pager.scrollLeft = 390;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('c');
    pager.scrollLeft = 780;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('c');
    // A swipe: the tab changes at the half way and clamps to the last page.
    pager.scrollLeft = 900;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('c');
    pager.scrollLeft = 1000;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('d');
    pager.scrollLeft = 5000;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('d');
    fixture.detectChanges();
    expect(screen.getByRole('tab', { name: 'Erledigt' })).toHaveAttribute('aria-selected', 'true');
    // A tab that a swipe made active scrolls nothing: the finger moves the pager.
    await fixture.whenStable();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // A finger on the pager ends the way to a tapped tab.
    cmp.select('a');
    fireEvent.pointerDown(pager);
    pager.scrollLeft = 400;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('b');
    // A scroll that comes to rest ends the hold of a tapped tab, wherever it rests.
    cmp.select('d');
    pager.scrollLeft = 790;
    pager.dispatchEvent(new Event('scrollend'));
    expect(host.tab()).toBe('c');
    // A tab whose page is already there scrolls nothing and holds nothing.
    const calls = scrollTo.mock.calls.length;
    cmp.select('c');
    expect(scrollTo).toHaveBeenCalledTimes(calls);
    pager.scrollLeft = 400;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('b');
    // An unknown tab does nothing; without a laid-out pager nothing moves.
    cmp.select('nope');
    cmp.select(null);
    expect(host.tab()).toBe('b');
    Object.defineProperty(pager, 'clientWidth', { configurable: true, value: 0 });
    fireEvent.scroll(pager);
    cmp.select('a');
    expect(host.tab()).toBe('a');
    expect(scrollTo).toHaveBeenCalledTimes(calls);
  });

  it('does not light up a disabled tab under a swipe', async () => {
    const { host, pager } = await setup({ tabs: [TABS[0], { ...TABS[1], disabled: true }, TABS[2]] });
    layOut(pager, 400);
    pager.scrollLeft = 400;
    fireEvent.scroll(pager);
    expect(host.tab()).toBe('a');
  });

  it('goes to the page of a new active tab from outside, at once on the first render', async () => {
    const { host, fixture, pager } = await setup();
    const scrollTo = layOut(pager, 300);
    host.tab.set('b');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 300, behavior: 'smooth' });
  });

  it('jumps without animation under reduced motion and right to left', async () => {
    const { cmp, host, pager } = await setup();
    const scrollTo = layOut(pager, 300);
    pager.style.direction = 'rtl';
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as unknown as typeof window.matchMedia;
    try {
      cmp.select('b');
    } finally {
      window.matchMedia = mm;
    }
    expect(scrollTo).toHaveBeenCalledWith({ left: -300, behavior: 'auto' });
    pager.scrollLeft = -300;
    cmp.onRest();
    pager.scrollLeft = -600;
    cmp.onRest();
    expect(host.tab()).toBe('c');
  });

  it('moves the ink between two tabs while the pager is between two pages', async () => {
    const { container, pager } = await setup();
    const bar = container.querySelector('.tp__bar') as HTMLElement;
    const ink = container.querySelector('.tp__ink') as HTMLElement;
    bar.getBoundingClientRect = () => rect(16, 380);
    const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
    tabs.forEach((t, i) => (t.getBoundingClientRect = () => rect(16 + i * 100, 60 + i * 20)));
    Object.defineProperty(pager, 'clientWidth', { configurable: true, value: 400 });
    const frame = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    try {
      pager.scrollLeft = 200;
      fireEvent.scroll(pager);
      expect(ink.style.transform).toBe('translateX(50px)');
      expect(ink.style.width).toBe('70px');
      // Past the last page the ink stays under the last tab.
      pager.scrollLeft = 4000;
      fireEvent.scroll(pager);
      expect(ink.style.transform).toBe('translateX(300px)');
      expect(ink.style.width).toBe('120px');
    } finally {
      frame.mockRestore();
    }
  });

  it('is as high as the page on screen, between two pages the higher one', async () => {
    const { container, pager } = await setup();
    const pages = Array.from(container.querySelectorAll<HTMLElement>('.tp__page'));
    pages.forEach((p, i) => Object.defineProperty(p, 'offsetHeight', { configurable: true, value: 100 + i * 50 }));
    Object.defineProperty(pager, 'clientWidth', { configurable: true, value: 400 });
    const frame = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    try {
      pager.scrollLeft = 0;
      fireEvent.scroll(pager);
      expect(pager.style.height).toBe('100px');
      pager.scrollLeft = 200;
      fireEvent.scroll(pager);
      expect(pager.style.height).toBe('150px');
    } finally {
      frame.mockRestore();
    }
  });

  it('keeps the height to the host in fill', async () => {
    const { pager } = await setup({ fill: true });
    Object.defineProperty(pager, 'clientWidth', { configurable: true, value: 400 });
    const frame = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    try {
      fireEvent.scroll(pager);
      expect(pager.style.height).toBe('');
    } finally {
      frame.mockRestore();
    }
  });

  it('shows the active tab when the tab bar is wider than the screen', async () => {
    const { host, fixture, container } = await setup();
    const strip = container.querySelector('[role="tablist"]') as HTMLElement;
    strip.getBoundingClientRect = () => rect(0, 300);
    const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
    tabs.forEach((t, i) => (t.getBoundingClientRect = () => rect(-150 + i * 160, 120)));
    const scrollBy = jest.fn();
    strip.scrollBy = scrollBy as unknown as typeof strip.scrollBy;
    // a starts left of the strip, d ends right of it, b lies inside.
    host.tab.set('d');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 150, behavior: 'smooth' });
    host.tab.set('a');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -150, behavior: 'smooth' });
    scrollBy.mockClear();
    host.tab.set('b');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('places the ink again once the web fonts are in', async () => {
    let loaded = (): void => undefined;
    const ready = new Promise<void>((resolve) => (loaded = resolve));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
    try {
      const { container } = await setup();
      const bar = container.querySelector('.tp__bar') as HTMLElement;
      const ink = container.querySelector('.tp__ink') as HTMLElement;
      bar.getBoundingClientRect = () => rect(0, 380);
      container.querySelector<HTMLElement>('[role="tab"]')!.getBoundingClientRect = () => rect(16, 90);
      loaded();
      await ready;
      await Promise.resolve();
      expect(ink.style.width).toBe('90px');
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });
});
