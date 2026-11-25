/*
 * The graph types of STUPA-Workflow that the graph view reads, with the same values, so the
 * app passes its lines as they are (S/framework/views/002270).
 */

/** The kind of an element of the graph: the kinds of a to-do link. */
export type GraphKind =
  | 'application'
  | 'meeting'
  | 'agenda_item'
  | 'vote'
  | 'appointment'
  | 'gremium'
  | 'invoice'
  | 'expense'
  | 'order'
  | 'event'
  | 'budget'
  | 'ticket'
  | 'todo'
  | 'paperless';

/** Where a relation comes from: a link that a person set, or a built-in relation. */
export type GraphSource = 'link' | 'builtin';

/** A line between two nodes, by their keys. */
export interface GraphLine {
  readonly key: string;
  readonly a: string;
  readonly b: string;
  readonly source: GraphSource;
}
