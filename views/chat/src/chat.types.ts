import { InjectionToken, signal, type Signal } from '@angular/core';
import type { PersonRef } from '@stupa-makers/ui-kit';

/*
 * The view models of the chat view (§S/framework/views/002276), a copy of the models of
 * `app-chat` of STUPA-Workflow. The app maps its API data to them.
 */

/** The virus scan state of a file. Absent: clean. */
export type ChatScanState = 'scanning' | 'clean' | 'quarantined';

/** The delivery state of a message. A message without a state counts as sent. */
export type ChatMessageState = 'sent' | 'sending' | 'failed';

/** A file on a message. Only a clean file is a link. */
export interface ChatFile {
  readonly id: string;
  readonly filename: string;
  readonly mime: string;
  readonly size: number;
  readonly url: string;
  readonly scanState?: ChatScanState;
  /** The send named the draft as missing: the server no longer has it. */
  readonly lost?: boolean;
}

/** One message of a thread. */
export interface ChatMessage {
  /** The server id, or a client id while the message is pending. */
  readonly id: string;
  /** null: the applicant or the system, shown without an avatar. */
  readonly author: PersonRef | null;
  /** Overrides the name, for example the Gremium in the applicant view. */
  readonly authorLabel?: string | null;
  /** Markdown. */
  readonly body: string;
  readonly at: string;
  readonly editedAt?: string | null;
  readonly own: boolean;
  /** May the viewer edit and delete the message. Unset: only an own message. */
  readonly canEdit?: boolean;
  readonly visibility?: string | null;
  readonly files?: readonly ChatFile[];
  readonly state?: ChatMessageState;
  /** The people the message mentions: their "@Name" is marked in the text. */
  readonly mentions?: readonly PersonRef[];
}

/** A status change or another event: small text in the middle of the thread. */
export interface ChatEvent {
  readonly id: string;
  readonly at: string;
  readonly text: string;
}

/** One option of the visibility switch. `internal` and `public` are the known values. */
export interface ChatVisibilityOption {
  readonly value: string;
  /** The label in the switch; with `guarded`, it names who reads the message. */
  readonly label: string;
}

/** The `send` output. `visibility` is set only when the thread offers a choice. */
export interface ChatSend {
  /** May be '' when the message has files. */
  readonly body: string;
  readonly visibility?: string;
  /** The ids of the people the text names as "@Name"; set only when it names someone. */
  readonly mentions?: readonly string[];
  /** The ids of the composer files; set only when the composer holds files. */
  readonly fileIds?: readonly string[];
  /** The composer files, for a pending bubble. */
  readonly files?: readonly ChatFile[];
}

/** The `edit` output. A consumer whose request fails calls `restore`. */
export interface ChatEdit {
  readonly id: string;
  readonly body: string;
  readonly mentions?: readonly string[];
  readonly restore?: () => void;
}

/** The `delete`, `retry` and `discard` outputs. */
export interface ChatRef {
  readonly id: string;
}

/** A file of the composer, uploaded as a draft. */
export interface ChatDraftFile {
  readonly id: string;
  readonly filename: string;
  readonly mime: string;
  readonly size: number;
  readonly scanState?: ChatScanState;
  /** The server no longer has the draft. */
  readonly failed?: boolean;
}

/** A file on its way up. */
export interface ChatPendingUpload {
  readonly key: string;
  readonly filename: string;
}

/** Why an upload failed. */
export type ChatUploadError = 'type' | 'tooLarge' | 'other';

/**
 * The draft files of the composer, which the app provides with `CHAT_FILES`. The view knows
 * no upload API: it adds, removes and sends files through this port.
 */
export interface ChatFiles {
  readonly files: Signal<readonly ChatDraftFile[]>;
  readonly pending: Signal<readonly ChatPendingUpload[]>;
  readonly busy: Signal<boolean>;
  /** The largest file in bytes. */
  readonly maxFileBytes: Signal<number>;
  /** The `accept` of the file input. */
  readonly accept: string;
  /** The files that can go out with a message. */
  usable(): readonly ChatDraftFile[];
  upload(files: readonly File[]): Promise<{ readonly failed: readonly { readonly filename: string; readonly reason: ChatUploadError }[] }>;
  /** False: the server refused the remove. */
  remove(id: string): Promise<boolean>;
  /** Forget the files after a send. */
  clear(): void;
  /** Delete the files on the server. */
  discard(): Promise<unknown>;
  /** The streamed URL of a sent file. */
  fileUrl(id: string): string;
  /** The thread whose files the port holds; a port that outlives the view keeps it. */
  threadKey(): string | null;
  setThreadKey(key: string): void;
  /** The view is gone: a port of the page keeps its files, the view's own port discards them. */
  release(): void;
}

/** The port of the draft files; without it, the chat takes no files. */
export const CHAT_FILES = new InjectionToken<ChatFiles>('CHAT_FILES');

/** The port of a chat without files: it holds nothing and takes nothing. */
export function noChatFiles(): ChatFiles {
  return {
    files: signal([]),
    pending: signal([]),
    busy: signal(false),
    maxFileBytes: signal(0),
    accept: '',
    usable: () => [],
    upload: async (files) => ({ failed: files.map((f) => ({ filename: f.name, reason: 'other' as const })) }),
    remove: async () => true,
    clear: () => undefined,
    discard: async () => undefined,
    fileUrl: (id) => id,
    threadKey: () => null,
    setThreadKey: () => undefined,
    release: () => undefined,
  };
}
