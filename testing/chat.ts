/** Fixtures of the chat view (002276) for the specs and the showcase. */
import { signal } from '@angular/core';
import type { ChatFiles, ChatMessage } from '../views/chat/src/chat.types';

/** A time today, so the day separator reads "Heute". */
export function todayAt(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const CHAT_MESSAGES: readonly ChatMessage[] = [
  { id: 'm1', author: { name: 'Jonas Albrecht', principalId: 'p-1' }, body: 'Hallo **zusammen**', at: todayAt(9), own: false, visibility: 'internal' },
  { id: 'm2', author: { name: 'Ada Lovelace', principalId: 'p-2' }, body: 'Danke @Jonas Albrecht', at: todayAt(9, 2), own: true, visibility: 'public', mentions: [{ name: 'Jonas Albrecht', principalId: 'p-1' }] },
  {
    id: 'm3',
    author: { name: 'Jonas Albrecht', principalId: 'p-1' },
    body: 'Anbei die Rechnung',
    at: todayAt(10),
    own: false,
    visibility: 'internal',
    files: [{ id: 'f1', filename: 'rechnung.pdf', mime: 'application/pdf', size: 2048, url: '/files/f1', scanState: 'scanning' }],
  },
];

/** A port with no files that records the calls. */
export function fakeChatFiles(): ChatFiles {
  const key = signal<string | null>(null);
  return {
    files: signal([]),
    pending: signal([]),
    busy: signal(false),
    maxFileBytes: signal(10 * 1024 * 1024),
    accept: '.pdf,.png',
    usable: () => [],
    upload: jest.fn(async () => ({ failed: [] })),
    remove: jest.fn(async () => true),
    clear: jest.fn(),
    discard: jest.fn(async () => undefined),
    fileUrl: (id: string) => `/files/${id}`,
    threadKey: () => key(),
    setThreadKey: (k: string) => key.set(k),
    release: jest.fn(),
  };
}
