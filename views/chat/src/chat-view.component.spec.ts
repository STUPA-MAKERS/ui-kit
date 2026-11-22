import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { CHAT_MESSAGES, fakeChatFiles } from '../../../testing/chat';
import { runAxe } from '../../../testing/a11y';
import { ChatViewComponent, chatUploadError } from './chat-view.component';
import { CHAT_FILES, noChatFiles, type ChatMessage } from './chat.types';
import { buildItems } from './chat.util';
import { chatPeople, highlightMentions } from './chat-mentions';

async function setup(inputs: Record<string, unknown> = {}) {
  const send = jest.fn();
  const files = fakeChatFiles();
  const view = await render(ChatViewComponent, {
    inputs: { messages: CHAT_MESSAGES, draftKey: 'spec', ...inputs },
    on: { send },
    providers: [{ provide: CHAT_FILES, useValue: files }],
  });
  return { view, send, files };
}

describe('ChatViewComponent §S/framework/views/002276', () => {
  afterEach(() => localStorage.clear());

  it('is a polite log with the messages, the day and the marks of both visibilities', async () => {
    await setup();
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
    expect(within(log).getByText('Heute')).toBeTruthy();
    expect(within(log).getAllByText('Jonas Albrecht').length).toBeGreaterThan(0);
    expect(log.querySelector('.chat__text strong')?.textContent).toBe('zusammen');
    expect(log.querySelector('.chat__mention')?.textContent).toBe('@Jonas Albrecht');
    expect(within(log).getAllByText('Intern').length).toBeGreaterThan(0);
    expect(within(log).getByText('rechnung.pdf')).toBeTruthy();
  });

  it('sends the draft with the chosen visibility and clears the composer', async () => {
    const { send, files } = await setup({
      visibilities: [
        { value: 'internal', label: 'Intern' },
        { value: 'public', label: 'Öffentlich' },
      ],
    });
    const box = screen.getByRole('textbox', { name: 'Nachricht schreiben …' }) as HTMLTextAreaElement;
    await userEvent.type(box, 'Neu{Enter}');
    expect(send).toHaveBeenCalledWith({ body: 'Neu', visibility: 'internal' });
    expect(box.value).toBe('');
    expect(files.clear).toHaveBeenCalled();
    expect(files.threadKey()).toBe('spec');
  });

  it('takes its placeholder from the app', async () => {
    await setup({ placeholder: 'Notiz schreiben …' });
    expect(screen.getByRole('textbox', { name: 'Notiz schreiben …' })).toBeTruthy();
  });

  it('shows the empty face and no composer without the right to post', async () => {
    await setup({ messages: [], canPost: false });
    expect(screen.getByText('Noch keine Nachrichten.')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('releases the port when it goes', async () => {
    const { view, files } = await setup();
    view.fixture.destroy();
    expect(files.release).toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { view } = await setup({ canAttach: true });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});

describe('chat helpers', () => {
  it('names the text of a refused upload', () => {
    expect(chatUploadError('type')).toBe('chat.error.fileType');
    expect(chatUploadError('tooLarge')).toBe('chat.error.fileTooLarge');
    expect(chatUploadError('other')).toBe('chat.error.upload');
  });

  it('lists only people with an id and a name, and marks their names', () => {
    expect(chatPeople([{ name: 'A', principalId: 'a' }, { name: 'B' }, { name: '', principalId: 'c' }])).toEqual([
      { principalId: 'a', displayName: 'A' },
    ]);
    expect(highlightMentions('Hi @A!', ['A'])).toBe('Hi <span class="chat__mention">@A</span>!');
  });

  it('groups the messages of one person within five minutes', () => {
    const items = buildItems(CHAT_MESSAGES as ChatMessage[], [], {
      marked: false,
      markerAt: null,
      dayLabel: () => 'Heute',
      name: (m) => m.author?.name ?? null,
    });
    expect(items.map((i) => i.kind)).toEqual(['day', 'msg', 'msg', 'msg']);
  });

  it('has a port without files', async () => {
    const none = noChatFiles();
    expect(none.usable()).toEqual([]);
    expect(await none.upload([new File(['x'], 'a.txt')])).toEqual({ failed: [{ filename: 'a.txt', reason: 'other' }] });
    expect(await none.remove('x')).toBe(true);
    none.clear();
    none.release();
    none.setThreadKey('k');
    expect(none.threadKey()).toBeNull();
    expect(none.fileUrl('x')).toBe('x');
    await none.discard();
  });
});
