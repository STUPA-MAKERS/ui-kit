import type { Action, PersonRef } from '@stupa-makers/ui-kit';

/** A file of a chat message. */
export interface ChatFile {
  readonly name: string;
  readonly url: string;
  readonly size?: number;
}

/** One message of a chat. */
export interface ChatMessage {
  readonly id: string;
  readonly author: PersonRef;
  readonly time: string;
  readonly text: string;
  readonly visibility?: string;
  readonly files?: readonly ChatFile[];
  readonly system?: boolean;
  readonly actions?: readonly Action[];
}

/** The composer below a chat. */
export interface Composer {
  readonly visibilities?: readonly { readonly value: string; readonly label: string; readonly readers: string }[];
  readonly value?: string;
  readonly files?: boolean;
}
