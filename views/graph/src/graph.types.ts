import type { ColourRole, IconName, RouteLink } from '@stupa-makers/ui-kit';

/** The data of the graph view. */
export interface GraphView {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly focus?: string | null;
}

/** One element of the graph. */
export interface GraphNode {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly icon: IconName;
  readonly colour: ColourRole;
  readonly link: RouteLink;
  readonly date?: string;
}

/** One relation between two elements. */
export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: 'link' | 'builtin';
  readonly label?: string;
}
