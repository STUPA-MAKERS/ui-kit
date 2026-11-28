import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  ButtonComponent,
  ButtonGroupComponent,
  IconComponent,
  ScrollFadeDirective,
  UiKitTranslatePipe,
  registerUiKitTexts,
} from '@stupa-makers/ui-kit';
import type {
  FlowCanvasCrumb,
  FlowCanvasEdge,
  FlowCanvasGroup,
  FlowCanvasNode,
  FlowCanvasProxy,
  FlowCanvasSide,
  FlowCanvasTempEdge,
  FlowCanvasTool,
} from './flow-canvas.types';
import { UI_KIT_FLOW_EDITOR_TEXTS } from './flow-editor.texts';

/** A pointer event on a part of the canvas, with the id of that part. */
export interface FlowCanvasPointer<T> {
  readonly event: PointerEvent;
  readonly id: T;
}

/** The labels of the pan tongues. */
const PAN_LABEL = {
  left: 'admin.flow.panLeft',
  right: 'admin.flow.panRight',
  up: 'admin.flow.panUp',
  down: 'admin.flow.panDown',
} as const;

/**
 * The canvas of the flow editor: the toolbar, the path of the open groups, the validation
 * alert, the SVG with the states, the transitions, the closed groups and the outside ends, the
 * pan tongues, the legend and the inspector sheet (S/framework/views/002277).
 *
 * The view draws what the app computes and reports each press; the app owns the graph, the
 * layout, the zoom and the selection. The canvas takes the whole width; the inspector is a
 * sheet over its right side while `sheetOpen` is true, and the bottom of the screen on a
 * phone (spec 003131). Slots: `[inspector]` fills the sheet, `[canvasState]` covers the canvas
 * while it loads or failed.
 */
@Component({
  selector: 'app-flow-canvas-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ButtonComponent, ButtonGroupComponent, IconComponent, ScrollFadeDirective, UiKitTranslatePipe],
  templateUrl: './flow-canvas-view.component.html',
  styleUrl: './flow-canvas-view.component.scss',
})
export class FlowCanvasViewComponent {
  /** The texts of the view, registered before the first render (002237). */
  protected readonly viewTexts = registerUiKitTexts(UI_KIT_FLOW_EDITOR_TEXTS);

  readonly nodes = input<readonly FlowCanvasNode[]>([]);
  readonly edges = input<readonly FlowCanvasEdge[]>([]);
  readonly groups = input<readonly FlowCanvasGroup[]>([]);
  readonly proxiesLeft = input<readonly FlowCanvasProxy[]>([]);
  readonly proxiesRight = input<readonly FlowCanvasProxy[]>([]);
  readonly tempEdge = input<FlowCanvasTempEdge | null>(null);
  readonly crumbs = input<readonly FlowCanvasCrumb[]>([]);
  /** The findings of the validation; the alert shows only while there are some. */
  readonly alerts = input<readonly string[]>([]);
  readonly viewBox = input('0 0 100 100');
  /** The canvas waits for the flow or its first layout: the SVG keeps its box but hides. */
  readonly pending = input(false);
  readonly zoomPercent = input(100);
  readonly canUndo = input(false);
  readonly canRedo = input(false);
  /** The number of selected states and groups; from 2 on, "Gruppieren" shows. */
  readonly multiCount = input(0);
  /** How much each side hides; a side with more than 0 shows its tongue. */
  readonly hiddenBy = input<Readonly<Record<FlowCanvasSide, number>>>({ left: 0, right: 0, up: 0, down: 0 });
  readonly heldSide = input<FlowCanvasSide | null>(null);
  readonly sheetOpen = input(false);

  readonly tool = output<FlowCanvasTool>();
  readonly navigate = output<string | null>();
  readonly canvasDown = output<PointerEvent>();
  readonly canvasMove = output<PointerEvent>();
  readonly canvasUp = output<PointerEvent>();
  readonly canvasWheel = output<WheelEvent>();
  readonly nodeDown = output<FlowCanvasPointer<string>>();
  readonly dotDown = output<FlowCanvasPointer<{ readonly key: string; readonly dot: string }>>();
  readonly edgeSelect = output<number>();
  readonly groupDown = output<FlowCanvasPointer<string>>();
  readonly proxyClick = output<string>();
  readonly hover = output<string | null>();
  readonly tonguePress = output<FlowCanvasPointer<FlowCanvasSide>>();
  readonly tongueStop = output<void>();
  readonly tongueKey = output<{ readonly event: KeyboardEvent; readonly side: FlowCanvasSide }>();
  readonly closeSheet = output<void>();

  /** The SVG: the app maps pointer positions into the world through it. */
  readonly svg = viewChild<ElementRef<SVGSVGElement>>('canvas');
  /** The box around the SVG: its size sets the scale of the fitted view. */
  readonly box = viewChild<ElementRef<HTMLElement>>('canvasWrap');
  /** The inspector sheet. */
  readonly sheet = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly sides: readonly FlowCanvasSide[] = ['left', 'right', 'up', 'down'];
  protected readonly panLabel = PAN_LABEL;
  protected readonly showAlerts = computed(() => this.alerts().length > 0);
}
