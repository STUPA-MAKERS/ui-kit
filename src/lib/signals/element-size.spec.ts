import { Component, ElementRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { elementSize, observeElementSize, type ElementSize } from './element-size';

describe('elementSize', () => {
  const original = globalThis.ResizeObserver;
  let fire: ResizeObserverCallback = () => {};
  const disconnect = jest.fn();

  beforeEach(() => {
    disconnect.mockClear();
    globalThis.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        fire = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect = disconnect;
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = original;
  });

  it('follows the content box and stops with its host', () => {
    @Component({ selector: 'app-size-host', standalone: true, template: '' })
    class Host {
      private readonly el = inject(ElementRef<HTMLElement>);
      readonly size = elementSize(() => this.el.nativeElement);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.componentInstance.size()).toEqual({ width: 0, height: 0 });
    fire([{ contentRect: { width: 320, height: 40 } } as ResizeObserverEntry], {} as ResizeObserver);
    expect(fixture.componentInstance.size()).toEqual({ width: 320, height: 40 });
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });

  it('reads the border box from the element', () => {
    const seen: ElementSize[] = [];
    @Component({ selector: 'app-border-host', standalone: true, template: '' })
    class Host {
      private readonly el = inject(ElementRef<HTMLElement>);
      constructor() {
        observeElementSize(() => this.el.nativeElement, (s) => seen.push(s), 'border');
      }
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 96 });
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 });
    fire([], {} as ResizeObserver);
    expect(seen.at(-1)).toEqual({ width: 200, height: 96 });
    fixture.destroy();
  });

  it('writes nothing without ResizeObserver or without a target', () => {
    // @ts-expect-error -- a browser without the API
    delete globalThis.ResizeObserver;
    const seen: ElementSize[] = [];
    @Component({ selector: 'app-old-host', standalone: true, template: '' })
    class Host {
      private readonly el = inject(ElementRef<HTMLElement>);
      constructor() {
        observeElementSize(() => this.el.nativeElement, (s) => seen.push(s));
        observeElementSize(() => null, (s) => seen.push(s));
      }
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(seen).toEqual([]);
    fixture.destroy();
  });
});
