import { Component, ElementRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { anchorOutOfView, placeBelow, showInTopLayer, watchAnchoredPopover } from './anchored-popover';

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

describe('placeBelow', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  it('puts the popover under the anchor at its start', () => {
    expect(placeBelow(rect(100, 100, 80, 30), { width: 200, height: 100 }, { gap: 4 })).toEqual({ top: 134, left: 100 });
  });

  it('aligns with the end edge', () => {
    expect(placeBelow(rect(500, 100, 80, 30), { width: 200, height: 100 }, { gap: 6, align: 'end' })).toEqual({
      top: 136,
      left: 380,
    });
  });

  it('moves in from the right edge and the left edge', () => {
    expect(placeBelow(rect(900, 100, 80, 30), { width: 200, height: 100 }, { gap: 4 }).left).toBe(792);
    expect(placeBelow(rect(2, 100, 80, 30), { width: 200, height: 100 }, { gap: 4 }).left).toBe(8);
  });

  it('flips above when there is no room below and room above', () => {
    expect(placeBelow(rect(100, 700, 80, 30), { width: 200, height: 200 }, { gap: 4 }).top).toBe(496);
    expect(placeBelow(rect(100, 100, 80, 650), { width: 200, height: 200 }, { gap: 4 }).top).toBe(754);
  });

  it('tells when the anchor left the viewport', () => {
    expect(anchorOutOfView(rect(0, -50, 10, 20))).toBe(true);
    expect(anchorOutOfView(rect(0, 900, 10, 20))).toBe(true);
    expect(anchorOutOfView(rect(0, 100, 10, 20))).toBe(false);
  });
});

describe('showInTopLayer', () => {
  it('shows a closed popover once and ignores a missing API', () => {
    const el = document.createElement('div') as HTMLElement & { showPopover: () => void };
    el.showPopover = jest.fn();
    showInTopLayer(el);
    expect(el.showPopover).toHaveBeenCalledTimes(1);
    expect(() => showInTopLayer(document.createElement('div'))).not.toThrow();
    expect(() => showInTopLayer(undefined)).not.toThrow();
  });
});

describe('watchAnchoredPopover', () => {
  it('closes on a press outside and follows a scroll outside its own box', () => {
    const close = jest.fn();
    const follow = jest.fn();
    let open = true;
    @Component({ selector: 'app-pop-host', standalone: true, template: '<div class="own"></div>' })
    class Host {
      private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
      constructor() {
        watchAnchoredPopover({
          isOpen: () => open,
          inside: () => [this.el],
          ownScroll: () => this.el.querySelector('.own'),
          close,
          follow,
        });
      }
    }
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    const own = (fixture.nativeElement as HTMLElement).querySelector('.own')!;
    own.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(close).not.toHaveBeenCalled();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(close).toHaveBeenCalledTimes(1);
    own.dispatchEvent(new Event('scroll'));
    expect(follow).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('resize'));
    expect(follow).toHaveBeenCalledTimes(1);
    open = false;
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    window.dispatchEvent(new Event('resize'));
    expect(close).toHaveBeenCalledTimes(1);
    expect(follow).toHaveBeenCalledTimes(1);
    open = true;
    fixture.destroy();
    window.dispatchEvent(new Event('resize'));
    expect(follow).toHaveBeenCalledTimes(1);
  });
});
