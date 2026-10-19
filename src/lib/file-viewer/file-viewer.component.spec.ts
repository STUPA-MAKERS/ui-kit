import { Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { UI_KIT_INTL, type DefaultUiKitIntl } from '../intl/intl';
import { FileViewerComponent } from './file-viewer.component';
import { type FileViewerItem, fileViewerKind } from './file-viewer.types';

const FILES: FileViewerItem[] = [
  { name: 'logo.png', url: '/api/attachments/1/download' },
  { name: 'Haushaltsplan.pdf', url: '/api/attachments/2/download' },
  { name: 'tabelle.xlsx', url: '/api/attachments/3/download' },
];

@Component({
  standalone: true,
  imports: [FileViewerComponent],
  template: `
    <button type="button" id="trigger" (click)="open.set(true)">Öffnen</button>
    <app-file-viewer
      [items]="items()"
      [(index)]="index"
      [(open)]="open"
      (closed)="closedCount = closedCount + 1"
    >
      <a viewerActions href="/dl" class="dl">Herunterladen</a>
      <a viewerFallback href="/dl-fallback" class="dl-fallback">Datei herunterladen</a>
    </app-file-viewer>
  `,
})
class Host {
  readonly items = signal<FileViewerItem[]>(FILES);
  readonly index = signal(0);
  readonly open = signal(false);
  closedCount = 0;
}

async function setup(opts: { items?: FileViewerItem[]; index?: number; open?: boolean } = {}) {
  const r = await render(Host);
  const host = r.fixture.componentInstance;
  if (opts.items) host.items.set(opts.items);
  if (opts.index !== undefined) host.index.set(opts.index);
  if (opts.open ?? true) {
    (document.getElementById('trigger') as HTMLButtonElement).focus();
    host.open.set(true);
  }
  r.fixture.detectChanges();
  await r.fixture.whenStable();
  return { ...r, host };
}

const dialog = (): HTMLElement => screen.getByRole('dialog');
const key = (k: string, init: KeyboardEventInit = {}): void => {
  fireEvent.keyDown(document, { key: k, ...init });
};

describe('fileViewerKind', () => {
  it.each<[FileViewerItem, string]>([
    [{ name: 'a', url: '/x', kind: 'pdf' }, 'pdf'],
    [{ name: 'a.bin', url: '/x', mime: 'image/png' }, 'image'],
    [{ name: 'a', url: '/x', mime: 'image/svg+xml' }, 'image'],
    [{ name: 'a', url: '/x', mime: 'application/pdf; charset=binary' }, 'pdf'],
    [{ name: 'a.png', url: '/x', mime: 'image/tiff' }, 'other'],
    [{ name: 'a.pdf', url: '/x', mime: 'application/octet-stream' }, 'pdf'],
    [{ name: 'Foto.JPEG', url: '/x' }, 'image'],
    [{ name: 'scan.pdf', url: '/x' }, 'pdf'],
    [{ name: 'download', url: '/files/scan.PDF?token=1#p=2' }, 'pdf'],
    [{ name: 'notes.txt', url: '/x' }, 'other'],
    [{ name: '.png', url: '/x' }, 'other'],
  ])('derives %j as %s', (item, kind) => {
    expect(fileViewerKind(item)).toBe(kind);
  });
});

describe('FileViewerComponent', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing while closed', async () => {
    await setup({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens as a modal dialog named by the file name, locks scroll and focuses close', async () => {
    await setup();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(dialog()).toHaveAccessibleName('logo.png');
    expect(screen.getByRole('heading', { level: 2, name: 'logo.png' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Vorschau schließen' })).toHaveFocus();
  });

  it('projects actions into the top bar', async () => {
    await setup();
    const bar = document.querySelector('.fv__bar') as HTMLElement;
    expect(bar).toContainElement(screen.getByRole('link', { name: 'Herunterladen' }));
  });

  it('closes by the close button: model, output, scroll and focus restored', async () => {
    const { host, fixture } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Vorschau schließen' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.open()).toBe(false);
    expect(host.closedCount).toBe(1);
    expect(document.body.style.overflow).toBe('');
    expect(document.getElementById('trigger')).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const { host, fixture } = await setup();
    key('Escape');
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(host.closedCount).toBe(1);
  });

  it('ignores Escape while closed', async () => {
    const { host } = await setup({ open: false });
    key('Escape');
    expect(host.closedCount).toBe(0);
  });

  it('shows an image as <img> with a loading state until it loads', async () => {
    const { fixture } = await setup();
    const img = screen.getByRole('img', { name: 'logo.png' }) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/api/attachments/1/download');
    expect(img).toHaveClass('fv__image');
    expect(screen.getByRole('status')).toHaveTextContent('Wird geladen…');
    fireEvent.load(img);
    fixture.detectChanges();
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('shows an error state when the image fails', async () => {
    const { fixture } = await setup();
    fireEvent.error(screen.getByRole('img', { name: 'logo.png' }));
    fixture.detectChanges();
    expect(screen.queryByRole('img', { name: 'logo.png' })).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Die Datei kann nicht angezeigt werden.');
  });

  it('shows a PDF in a titled iframe that fills the stage', async () => {
    const { fixture } = await setup({ index: 1 });
    const frame = document.querySelector('iframe') as HTMLIFrameElement;
    expect(frame).not.toBeNull();
    expect(frame.getAttribute('src')).toBe('/api/attachments/2/download');
    expect(frame).toHaveAttribute('title', 'Haushaltsplan.pdf');
    expect(document.querySelector('.fv__stage')).toHaveClass('fv__stage--pdf');
    expect(document.querySelector('img')).toBeNull();
    fireEvent.load(frame);
    fixture.detectChanges();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows a fallback with icon, name and the projected action for other files', async () => {
    await setup({ index: 2 });
    expect(document.querySelector('iframe, img')).toBeNull();
    const message = document.querySelector('.fv__message') as HTMLElement;
    expect(message).toHaveTextContent('tabelle.xlsx');
    expect(message).toHaveTextContent('Für diese Datei gibt es keine Vorschau.');
    expect(message.querySelector('[data-icon="file"]')).not.toBeNull();
    expect(message).toContainElement(screen.getByRole('link', { name: 'Datei herunterladen' }));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('navigates with the chevron buttons and stops at the ends', async () => {
    const { host, fixture } = await setup();
    const prev = screen.getByRole('button', { name: 'Vorherige Datei' });
    const next = screen.getByRole('button', { name: 'Nächste Datei' });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    expect(document.querySelector('.fv__position')).toHaveTextContent('1 von 3');

    await userEvent.click(next);
    fixture.detectChanges();
    expect(host.index()).toBe(1);
    expect(dialog()).toHaveAccessibleName('Haushaltsplan.pdf');
    expect(document.querySelector('.fv__position')).toHaveTextContent('2 von 3');

    await userEvent.click(next);
    fixture.detectChanges();
    expect(host.index()).toBe(2);
    expect(next).toBeDisabled();
    expect(prev).toBeEnabled();

    await userEvent.click(prev);
    fixture.detectChanges();
    expect(host.index()).toBe(1);
  });

  it('navigates with ArrowLeft/ArrowRight and stops at the ends', async () => {
    const { host, fixture } = await setup();
    key('ArrowLeft');
    expect(host.index()).toBe(0);
    key('ArrowRight');
    fixture.detectChanges();
    expect(host.index()).toBe(1);
    key('ArrowRight');
    key('ArrowRight');
    fixture.detectChanges();
    expect(host.index()).toBe(2);
    key('ArrowLeft');
    fixture.detectChanges();
    expect(host.index()).toBe(1);
  });

  it('ignores arrows with modifiers and while closed', async () => {
    const { host } = await setup({ open: false });
    key('ArrowRight');
    expect(host.index()).toBe(0);
    host.open.set(true);
    key('ArrowRight', { altKey: true });
    expect(host.index()).toBe(0);
  });

  it('navigates on a horizontal swipe', async () => {
    const { host, fixture } = await setup();
    const stage = document.querySelector('.fv__stage') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 210 }] });
    fixture.detectChanges();
    expect(host.index()).toBe(1);
    fireEvent.touchStart(stage, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 250, clientY: 200 }] });
    fixture.detectChanges();
    expect(host.index()).toBe(0);
    // Mostly vertical: no navigation.
    fireEvent.touchStart(stage, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 170, clientY: 400 }] });
    expect(host.index()).toBe(0);
  });

  it('shows no arrows for a single file', async () => {
    await setup({ items: [FILES[0]] });
    expect(screen.queryByRole('button', { name: 'Nächste Datei' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Vorherige Datei' })).toBeNull();
  });

  it('clamps an out-of-range index', async () => {
    await setup({ index: 9 });
    expect(dialog()).toHaveAccessibleName('tabelle.xlsx');
  });

  it('keeps Tab inside the viewer', async () => {
    await setup();
    const link = screen.getByRole('link', { name: 'Herunterladen' });
    const next = screen.getByRole('button', { name: 'Nächste Datei' });
    next.focus();
    key('Tab');
    // The fallback link is not rendered for an image, so the next button is last.
    expect(link).toHaveFocus();
    key('Tab', { shiftKey: true });
    expect(next).toHaveFocus();
  });

  it('wraps focus through the sentinels (Tab out of an iframe)', async () => {
    await setup({ index: 1 });
    const sentinels = document.querySelectorAll<HTMLElement>('.fv__sentinel');
    sentinels[1].focus();
    expect(screen.getByRole('link', { name: 'Herunterladen' })).toHaveFocus();
    sentinels[0].focus();
    expect(screen.getByRole('button', { name: 'Nächste Datei' })).toHaveFocus();
  });

  it('labels the controls in English', async () => {
    const { fixture } = await setup({ open: false });
    (fixture.debugElement.injector.get(UI_KIT_INTL) as DefaultUiKitIntl).setLang('en');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Close preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next file' })).toBeInTheDocument();
    expect(document.querySelector('.fv__position')).toHaveTextContent('1 of 3');
    (fixture.debugElement.injector.get(UI_KIT_INTL) as DefaultUiKitIntl).setLang('de');
  });

  it.each([0, 1, 2])('has no axe violations (item %i)', async (index) => {
    const { container } = await setup({ index });
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
