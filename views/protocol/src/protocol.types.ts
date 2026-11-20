/** The tools of the protocol editor. */
export type ProtocolTool = 'blackout' | 'time-note' | 'pdf' | 'vote' | 'image' | 'table' | 'math';

/** The input of the protocol editor. */
export interface ProtocolEditorInput {
  readonly value: string;
  readonly readOnly?: boolean;
  readonly knownNames?: readonly string[];
  readonly tools?: readonly ProtocolTool[];
  readonly votes?: readonly { readonly id: string; readonly label: string }[];
}
