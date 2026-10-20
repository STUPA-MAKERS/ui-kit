import { Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { CopyButtonComponent } from './copy-button.component';
import { copyText } from './copy-text';

function mockClipboard(writeText: jest.Mock | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

/** Let the clipboard promise and the copy handler settle. */
async function settle(): Promise<void> {
  for (let i = 0; i < 3; i++) await Promise.resolve();
}

@Component({
  standalone: true,
  imports: [CopyButtonComponent],
  template: `<app-copy-button [text]="text()" [resetMs]="resetMs()" (copiedChange)="result = $event" />`,
})
class Host {
  readonly text = signal('https://example.org/j/ABC');
  readonly resetMs = signal(2000);
  result: boolean | null = null;
}

describe('copyText', () => {
  afterEach(() => mockClipboard(undefined));

  it('writes the text and resolves true', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    mockClipboard(write);
    await expect(copyText('abc')).resolves.toBe(true);
    expect(write).toHaveBeenCalledWith('abc');
  });

  it('resolves false without a Clipboard API or when the write is refused', async () => {
    mockClipboard(undefined);
    await expect(copyText('abc')).resolves.toBe(false);
    mockClipboard(jest.fn().mockRejectedValue(new Error('denied')));
    await expect(copyText('abc')).resolves.toBe(false);
    mockClipboard(
      jest.fn(() => {
        throw new Error('sync');
      }),
    );
    await expect(copyText('abc')).resolves.toBe(false);
  });
});

describe('CopyButtonComponent', () => {
  afterEach(() => {
    jest.useRealTimers();
    mockClipboard(undefined);
  });

  it('copies the text, shows "Kopiert" with a check, says it and goes back after the delay', async () => {
    jest.useFakeTimers();
    const write = jest.fn().mockResolvedValue(undefined);
    mockClipboard(write);
    const view = await render(Host);
    const button = screen.getByRole('button', { name: 'Kopieren' });
    expect(button.querySelector('[data-icon="copy"]')).not.toBeNull();
    fireEvent.click(button);
    await settle();
    view.fixture.detectChanges();
    expect(write).toHaveBeenCalledWith('https://example.org/j/ABC');
    expect(view.fixture.componentInstance.result).toBe(true);
    expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument();
    expect(button.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(document.querySelector('.cb__live')).toHaveTextContent('Kopiert');
    jest.advanceTimersByTime(2000);
    view.fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
    expect(document.querySelector('.cb__live')).toHaveTextContent('');
  });

  it('shares a link through the share sheet on a touch device and keeps its look', async () => {
    const realMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query === '(pointer: coarse)',
    })) as unknown as typeof window.matchMedia;
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    const write = jest.fn().mockResolvedValue(undefined);
    mockClipboard(write);
    try {
      const view = await render(
        `<app-copy-button text="https://example.org/s/x" [share]="true" shareTitle="Antrag" (copiedChange)="seen.push($event)" />`,
        { imports: [CopyButtonComponent], componentProperties: { seen: [] as boolean[] } },
      );
      fireEvent.click(screen.getByRole('button', { name: 'Kopieren' }));
      await settle();
      view.fixture.detectChanges();
      expect(share).toHaveBeenCalledWith({ url: 'https://example.org/s/x', title: 'Antrag' });
      expect(write).not.toHaveBeenCalled();
      expect(view.fixture.componentInstance.seen).toEqual([]);
      expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
      // Without a share sheet the same button copies.
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      fireEvent.click(screen.getByRole('button', { name: 'Kopieren' }));
      await settle();
      view.fixture.detectChanges();
      expect(write).toHaveBeenCalledWith('https://example.org/s/x');
      expect(view.fixture.componentInstance.seen).toEqual([true]);
      expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument();
    } finally {
      window.matchMedia = realMatchMedia;
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    }
  });

  it('stays as it was when the write is refused', async () => {
    mockClipboard(jest.fn(() => Promise.reject(new Error('denied'))));
    const view = await render(Host);
    fireEvent.click(screen.getByRole('button', { name: 'Kopieren' }));
    await settle();
    view.fixture.detectChanges();
    expect(view.fixture.componentInstance.result).toBe(false);
    expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
  });

  it('keeps the copied state with resetMs 0 until the text changes', async () => {
    jest.useFakeTimers();
    mockClipboard(jest.fn().mockResolvedValue(undefined));
    const view = await render(Host);
    view.fixture.componentInstance.resetMs.set(0);
    view.fixture.detectChanges();
    fireEvent.click(screen.getByRole('button'));
    await settle();
    view.fixture.detectChanges();
    jest.advanceTimersByTime(10_000);
    view.fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Kopiert' })).toBeInTheDocument();
    view.fixture.componentInstance.text.set('https://example.org/j/XYZ');
    view.fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
  });

  it('drops the copied state on reset', async () => {
    mockClipboard(jest.fn().mockResolvedValue(undefined));
    const view = await render(`<app-copy-button text="x" />`, { imports: [CopyButtonComponent] });
    fireEvent.click(screen.getByRole('button'));
    await settle();
    view.fixture.detectChanges();
    const cmp = view.fixture.debugElement.children[0].componentInstance as CopyButtonComponent;
    expect(cmp.copied()).toBe(true);
    cmp.reset();
    view.fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Kopieren' })).toBeInTheDocument();
  });

  it('does nothing without a text', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    mockClipboard(write);
    const view = await render(Host);
    view.fixture.componentInstance.text.set('');
    view.fixture.detectChanges();
    fireEvent.click(screen.getByRole('button'));
    await settle();
    expect(write).not.toHaveBeenCalled();
    expect(view.fixture.componentInstance.result).toBeNull();
  });

  it('takes own labels, an accessible name and no icon', async () => {
    mockClipboard(jest.fn().mockResolvedValue(undefined));
    const view = await render(
      `<app-copy-button text="{}" label="Kopieren" copiedLabel="Kopiert!" ariaLabel="MCP-Konfiguration kopieren" [icon]="false" variant="text" />`,
      { imports: [CopyButtonComponent] },
    );
    const button = screen.getByRole('button', { name: 'MCP-Konfiguration kopieren' });
    expect(button).toHaveTextContent('Kopieren');
    expect(button.querySelector('app-icon')).toBeNull();
    expect(button).toHaveClass('btn--text');
    fireEvent.click(button);
    await settle();
    view.fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Kopiert!' })).toBeInTheDocument();
  });
});
