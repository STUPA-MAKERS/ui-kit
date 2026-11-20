/** The graph of a flow. */
export interface FlowGraph {
  readonly states: readonly { readonly id: string; readonly label: string; readonly kind: string }[];
  readonly transitions: readonly {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly label: string;
    readonly guard?: string;
  }[];
}

/** One change of the flow editor. */
export interface FlowOp {
  readonly kind: 'add-state' | 'move' | 'connect' | 'remove' | 'edit';
  readonly target?: string;
  readonly data?: Readonly<Record<string, unknown>>;
}
