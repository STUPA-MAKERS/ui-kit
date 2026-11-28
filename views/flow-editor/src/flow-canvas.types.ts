/**
 * The shapes that `app-flow-canvas-view` draws. The app computes them (the places come from
 * its automatic layout) and the view only draws them and reports the pointer.
 */

/** A connector dot on the east side of a state: one per guard group or vote branch. */
export interface FlowCanvasDot {
  readonly id: string;
  /** A vote branch, or null for a guard group. */
  readonly branch: string | null;
  /** The dot belongs to a guard group with a guard. */
  readonly guarded: boolean;
  /** Y of the dot from the top of the box. */
  readonly cy: number;
  /** The text beside the dot; empty for none. */
  readonly label: string;
}

/** A state on the canvas. */
export interface FlowCanvasNode {
  readonly key: string;
  readonly label: string;
  readonly kind: string;
  /** The label of a kind other than `normal`, shown above the box. */
  readonly kindLabel: string;
  readonly color: string | null;
  readonly isInitial: boolean;
  readonly isTerminal: boolean;
  /** A vote state that takes its Gremium from the cost centre. */
  readonly gremiumFromBudget: boolean;
  readonly selected: boolean;
  readonly multi: boolean;
  /** Outside the focus: drawn faint. */
  readonly dim: boolean;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly dots: readonly FlowCanvasDot[];
}

/** A transition on the canvas. */
export interface FlowCanvasEdge {
  readonly index: number;
  /** The SVG path of the line. */
  readonly d: string;
  /** Centre of the label. */
  readonly mx: number;
  readonly my: number;
  readonly label: string;
  readonly labeled: boolean;
  readonly automatic: boolean;
  readonly color: string | null;
  readonly selected: boolean;
  readonly dim: boolean;
}

/** A closed group on the current level. */
export interface FlowCanvasGroup {
  readonly id: string;
  readonly name: string;
  readonly color: string | null;
  readonly multi: boolean;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** The number of states inside, at every depth. */
  readonly count: number;
  /** Y offsets of the outgoing dots. */
  readonly outDotYs: readonly number[];
}

/** An end outside the open group: a state or a group of another level. */
export interface FlowCanvasProxy {
  readonly pid: string;
  readonly label: string;
  readonly isGroup: boolean;
  readonly x: number;
  readonly y: number;
}

/** The line that follows the pointer while a new transition is drawn. */
export interface FlowCanvasTempEdge {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** A side of the canvas, and the direction its scroll tongue pans to. */
export type FlowCanvasSide = 'left' | 'right' | 'up' | 'down';

/** A level above the current one, for the path above the canvas. */
export interface FlowCanvasCrumb {
  readonly id: string;
  readonly name: string;
}

/** A button of the toolbar. */
export type FlowCanvasTool = 'addState' | 'undo' | 'redo' | 'group' | 'zoomIn' | 'zoomOut' | 'resetView';
