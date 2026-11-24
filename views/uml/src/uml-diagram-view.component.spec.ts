import { TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { provideUiKit } from '@stupa-makers/ui-kit';

import { UmlDiagramViewComponent } from './uml-diagram-view.component';
import { umlEndPlace, umlLinePath, type UmlLayout, type UmlLine } from './uml.types';

const LINE: UmlLine = {
  id: 'e0',
  from: 'a',
  to: 'b',
  points: [
    { x: 90, y: 40 },
    { x: 200, y: 40 },
  ],
  label: 'fk',
  labelX: 120,
  labelY: 30,
  dashed: false,
  curve: false,
  weight: 1,
  ends: ['*', '1'],
};

const LAYOUT: UmlLayout = {
  width: 400,
  height: 200,
  boxes: [
    { id: '__frame:x', role: 'frame', name: 'x', lines: [], x: 0, y: 0, w: 400, h: 200 },
    { id: '__start', role: 'start', name: '', lines: [], x: 0, y: 0, w: 18, h: 18 },
    { id: 'a', role: 'element', name: 'a', lines: ['id: UUID'], x: 10, y: 10, w: 80, h: 60 },
    { id: 'b', role: 'element', name: 'b', lines: [], x: 200, y: 10, w: 80, h: 30 },
  ],
  lines: [LINE],
};

type Testable = UmlDiagramViewComponent & {
  onKey(e: KeyboardEvent): void;
  onWheel(e: WheelEvent): void;
  onDown(e: PointerEvent): void;
  onMove(e: PointerEvent): void;
  onUp(e: PointerEvent): void;
  dragging(): boolean;
};

function create(selected: string | null = null) {
  TestBed.configureTestingModule({ providers: [provideUiKit()] });
  const fixture = TestBed.createComponent(UmlDiagramViewComponent);
  fixture.componentRef.setInput('layout', LAYOUT);
  fixture.componentRef.setInput('selected', selected);
  fixture.componentRef.setInput('label', 'Diagramm');
  fixture.detectChanges();
  return fixture;
}

const pointer = (o: Record<string, unknown>): PointerEvent =>
  ({ currentTarget: null, ...o }) as unknown as PointerEvent;

describe('UmlDiagramViewComponent §S/framework/views/002791', () => {
  it('draws the frames, the boxes, the lines and the end labels', () => {
    const fixture = create('a');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.ud__frame-box').length).toBe(1);
    expect(el.querySelectorAll('.ud__box').length).toBe(2);
    expect(el.querySelector('.ud__start')).toBeTruthy();
    expect(el.querySelector('.ud__box--on')?.textContent).toContain('a');
    expect(el.querySelector('.ud__edge--on')).toBeTruthy();
    expect([...el.querySelectorAll('.ud__label')].map((t) => t.textContent)).toEqual([
      'fk',
      '*',
      '1',
    ]);
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Diagramm');
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Zoom');
  });

  it('emits pick with the id of a clicked box', () => {
    const fixture = create();
    const picked: string[] = [];
    fixture.componentInstance.pick.subscribe((id) => picked.push(id));
    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<SVGGElement>('.ud__box')[1]!
      .dispatchEvent(new MouseEvent('click'));
    expect(picked).toEqual(['b']);
  });

  it('zooms with the buttons, the wheel and the keys, and moves with a drag and the arrows', () => {
    const fixture = create();
    const c = fixture.componentInstance as Testable;
    c.fit();
    const start = c.scale();
    c.zoomBy(2);
    expect(c.scale()).toBeCloseTo(Math.min(3, start * 2));
    c.onKey(new KeyboardEvent('keydown', { key: '-' }));
    c.onKey(new KeyboardEvent('keydown', { key: '+' }));
    c.onKey(new KeyboardEvent('keydown', { key: '0' }));
    expect(c.scale()).toBeCloseTo(start);
    const x = c.x();
    c.onKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(c.x()).toBe(x + 40);
    c.onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    c.onKey(new KeyboardEvent('keydown', { key: 'x' }));
    c.onWheel(new WheelEvent('wheel', { deltaY: -100 }));
    expect(c.scale()).toBeGreaterThan(start);
    c.onWheel(new WheelEvent('wheel', { deltaY: 100 }));
    c.onDown(pointer({ button: 0, pointerId: 1, clientX: 0, clientY: 0 }));
    c.onMove(pointer({ pointerId: 1, clientX: 2, clientY: 0 }));
    expect(c.dragging()).toBe(false);
    c.onMove(pointer({ pointerId: 1, clientX: 50, clientY: 30 }));
    expect(c.dragging()).toBe(true);
    c.onMove(pointer({ pointerId: 2, clientX: 0, clientY: 0 }));
    c.onUp(pointer({ pointerId: 1 }));
    expect(c.dragging()).toBe(false);
    c.onUp(pointer({ pointerId: 1 }));
    c.onDown(pointer({ button: 2, pointerId: 3 }));
    expect(c.dragging()).toBe(false);
  });

  it('draws a curve and places the end labels beside the ends', () => {
    expect(umlLinePath(LINE)).toBe('M90,40 L200,40');
    const curve: UmlLine = {
      ...LINE,
      curve: true,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ],
    };
    expect(umlLinePath(curve)).toBe('M0,0 C1,1 2,2 3,3');
    expect(umlEndPlace(LINE, false)).toEqual({ x: 100, y: 36 });
    expect(umlEndPlace(LINE, true)).toEqual({ x: 190, y: 36 });
    expect(umlEndPlace({ ...LINE, points: [] }, true)).toEqual({ x: 0, y: 0 });
  });

  it('has no axe violations', async () => {
    const fixture = create('a');
    expect(await axe(fixture.nativeElement as HTMLElement)).toHaveNoViolations();
  });
});
