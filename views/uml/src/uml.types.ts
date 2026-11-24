/*
 * The view model of the UML view (S/framework/views/002791): a laid-out drawing. The app lays
 * out its view (for example with ELK) and passes the boxes and the lines with their places.
 */

/** The size of the text in the drawing, in SVG units. The layout of the app uses the same. */
export const UML_CHAR_W = 7.4;
export const UML_LINE_H = 18;
export const UML_HEAD_H = 30;
export const UML_PAD_X = 12;

/** One box of the drawing. */
export interface UmlBox {
  readonly id: string;
  /** `element`: an element of the view; `frame`: a module or network; `start`: the start point. */
  readonly role: 'element' | 'frame' | 'start';
  readonly name: string;
  readonly lines: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A point of a line. */
export interface UmlPoint {
  readonly x: number;
  readonly y: number;
}

/** One line of the drawing between two boxes. */
export interface UmlLine {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly points: readonly UmlPoint[];
  readonly label: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly dashed: boolean;
  /** The points are a cubic Bézier curve (start, two control points, end), not corners. */
  readonly curve: boolean;
  /** The width of the stroke. */
  readonly weight: number;
  /** The multiplicity at the start and at the end, for example of a foreign key. */
  readonly ends: readonly [string, string] | null;
}

/** A laid-out view: its size, its boxes and its lines. */
export interface UmlLayout {
  readonly width: number;
  readonly height: number;
  readonly boxes: readonly UmlBox[];
  readonly lines: readonly UmlLine[];
}

/** The path of a line through its points. */
export function umlLinePath(l: UmlLine): string {
  if (l.curve && l.points.length === 4) {
    const [a, b, c, d] = l.points as readonly [UmlPoint, UmlPoint, UmlPoint, UmlPoint];
    return `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;
  }
  return l.points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
}

/** The place of an end label: a little beside the first or the last point of a line. */
export function umlEndPlace(l: UmlLine, atEnd: boolean): UmlPoint {
  const pts = l.points;
  if (pts.length < 2) return { x: 0, y: 0 };
  const a = atEnd ? pts[pts.length - 1]! : pts[0]!;
  const b = atEnd ? pts[pts.length - 2]! : pts[1]!;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  return { x: a.x + dx * 10 + (dy ? 6 : 0), y: a.y + dy * 14 + (dx ? -4 : 0) };
}
