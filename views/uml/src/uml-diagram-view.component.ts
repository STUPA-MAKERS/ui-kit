import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ButtonComponent,
  IconComponent,
  UiKitTranslatePipe,
  registerUiKitTexts,
} from '@stupa-makers/ui-kit';

import { UI_KIT_UML_TEXTS } from './uml.texts';
import {
  UML_HEAD_H,
  UML_LINE_H,
  UML_PAD_X,
  umlEndPlace,
  umlLinePath,
  type UmlLayout,
  type UmlLine,
  type UmlPoint,
} from './uml.types';

const MIN = 0.1;
const MAX = 3;
const STEP = 1.25;
/** The tools sit over the top end corner, so the fitted drawing starts below them. */
const FIT_TOP = 64;

let nextId = 0;

/**
 * The SVG drawing of one laid-out UML view, with zoom and move (S/framework/views/002791), a
 * copy of the drawing of the page UML of the spec explorer.
 *
 * The drawing is one picture for assistive technology (`role="img"` with `label`); the app
 * shows the same content as text in a list. A click on a box emits `pick` with its id. The
 * buttons, the wheel and `+`, `-`, `0` zoom and fit; a drag and the arrow keys move it.
 */
@Component({
  selector: 'app-uml-diagram-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent, UiKitTranslatePipe],
  templateUrl: './uml-diagram-view.component.html',
  styleUrl: './uml-diagram-view.component.scss',
})
export class UmlDiagramViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_UML_TEXTS);

  readonly layout = input.required<UmlLayout>();
  /** The id of the chosen box. */
  readonly selected = input<string | null>(null);
  /** The view is a state view: round boxes with the name in the middle. */
  readonly state = input(false);
  /** The label of the drawing for a screen reader. */
  readonly label = input.required<string>();
  /** The person clicked a box: its id. */
  readonly pick = output<string>();

  protected readonly headH = UML_HEAD_H;
  protected readonly lineH = UML_LINE_H;
  protected readonly padX = UML_PAD_X;
  protected readonly step = STEP;
  protected readonly arrowId = `ud-arrow-${nextId++}`;
  protected readonly arrowRef = `url(#${this.arrowId})`;

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  readonly scale = signal(1);
  readonly x = signal(0);
  readonly y = signal(0);
  protected readonly dragging = signal(false);
  private drag: {
    id: number;
    sx: number;
    sy: number;
    x: number;
    y: number;
    moved: boolean;
  } | null = null;

  protected readonly frames = computed(() => this.layout().boxes.filter((b) => b.role === 'frame'));
  protected readonly items = computed(() => this.layout().boxes.filter((b) => b.role !== 'frame'));
  protected readonly transform = computed(
    () => `translate(${this.x()},${this.y()}) scale(${this.scale()})`,
  );

  constructor() {
    effect(() => {
      this.layout();
      untracked(() => queueMicrotask(() => this.fit()));
    });
  }

  protected path(l: UmlLine): string {
    return umlLinePath(l);
  }

  protected end(l: UmlLine, atEnd: boolean): UmlPoint {
    return umlEndPlace(l, atEnd);
  }

  /** Fit the whole drawing into the frame, at most at its natural size. */
  fit(): void {
    const el = this.frame().nativeElement;
    const { width, height } = this.layout();
    const w = el.clientWidth || 800;
    const h = el.clientHeight || 600;
    if (!width || !height) return;
    const s = Math.min(1, (w - 32) / width, (h - FIT_TOP - 16) / height);
    this.scale.set(Math.max(MIN, s));
    this.x.set((w - width * this.scale()) / 2);
    this.y.set(FIT_TOP);
  }

  /** Zoom around a point of the frame, by default its middle. */
  zoomBy(factor: number, cx?: number, cy?: number): void {
    const el = this.frame().nativeElement;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    const old = this.scale();
    const next = Math.min(MAX, Math.max(MIN, old * factor));
    this.x.set(px - ((px - this.x()) * next) / old);
    this.y.set(py - ((py - this.y()) * next) / old);
    this.scale.set(next);
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.frame().nativeElement.getBoundingClientRect();
    this.zoomBy(
      event.deltaY < 0 ? 1.1 : 1 / 1.1,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  protected onDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.drag = {
      id: event.pointerId,
      sx: event.clientX,
      sy: event.clientY,
      x: this.x(),
      y: this.y(),
      moved: false,
    };
  }

  protected onMove(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.sx;
    const dy = event.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) {
      d.moved = true;
      this.dragging.set(true);
      (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId);
    }
    this.x.set(d.x + dx);
    this.y.set(d.y + dy);
  }

  protected onUp(event: PointerEvent): void {
    if (this.drag?.id !== event.pointerId) return;
    this.drag = null;
    this.dragging.set(false);
  }

  /** `+`, `-` and `0` zoom and fit; the arrow keys move the drawing. */
  protected onKey(event: KeyboardEvent): void {
    const move: Readonly<Record<string, readonly [number, number]>> = {
      ArrowLeft: [40, 0],
      ArrowRight: [-40, 0],
      ArrowUp: [0, 40],
      ArrowDown: [0, -40],
    };
    const by = move[event.key];
    if (event.key === '+' || event.key === '=') this.zoomBy(STEP);
    else if (event.key === '-') this.zoomBy(1 / STEP);
    else if (event.key === '0') this.fit();
    else if (by) {
      this.x.update((v) => v + by[0]);
      this.y.update((v) => v + by[1]);
    } else return;
    event.preventDefault();
  }
}
