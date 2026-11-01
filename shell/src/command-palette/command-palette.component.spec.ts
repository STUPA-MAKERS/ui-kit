import { Component, computed, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import {
  CommandPaletteComponent,
  type PaletteGroup,
  type PaletteRow,
} from './command-palette.component';
import { CommandPalette } from './command-palette.service';

const PAGES: PaletteRow[] = [
  {
    id: 'page:/tasks',
    icon: 'tasks',
    title: 'Aufgaben',
    subtitle: 'Arbeit',
    link: '/tasks',
  },
  {
    id: 'page:/admin/roles',
    icon: 'gear',
    title: 'Rollen',
    subtitle: 'Verwaltung',
    link: '/admin/roles',
  },
];
const RECORDS: PaletteRow[] = [
  {
    id: 'application:1',
    icon: 'file',
    title: 'Lastenrad',
    subtitle: 'In Prüfung',
    status: true,
    link: '/applications/1?tab=history',
  },
  {
    id: 'application:2',
    icon: 'file',
    title: 'Laptop',
    subtitle: 'Abgelehnt',
    status: true,
    archived: true,
    link: '/applications/2',
  },
];

/** The app side: it runs its own search on the query and hands the groups back. */
@Component({
  standalone: true,
  imports: [CommandPaletteComponent],
  template: `
    <button type="button" id="before">Vorher</button>
    <app-command-palette
      [groups]="groups()"
      [(query)]="query"
      [loading]="loading()"
      [truncated]="truncated()"
      (pick)="picked.push($event)"
    />
  `,
})
class HostComponent {
  readonly query = signal('');
  readonly loading = signal(false);
  readonly truncated = signal(false);
  readonly records = signal<PaletteRow[]>([]);
  readonly picked: PaletteRow[] = [];
  readonly groups = computed<PaletteGroup[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const pages = PAGES.filter((p) => p.title.toLowerCase().includes(q));
    const out: PaletteGroup[] = [];
    if (pages.length) out.push({ label: 'Seiten', rows: pages });
    if (this.records().length) out.push({ label: 'Anträge', rows: this.records() });
    return out;
  });
}

async function setup() {
  const view = await render(HostComponent, { providers: [provideRouter([])] });
  const injector = view.fixture.debugElement.injector;
  const router = injector.get(Router);
  const nav = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return {
    ...view,
    host: view.fixture.componentInstance,
    palette: injector.get(CommandPalette),
    nav,
  };
}

const field = () => screen.getByRole('combobox', { name: 'Suche' });

async function open(view: Awaited<ReturnType<typeof setup>>) {
  view.palette.open();
  view.fixture.detectChanges();
  await Promise.resolve();
}

async function type(view: Awaited<ReturnType<typeof setup>>, text: string) {
  fireEvent.input(field(), { target: { value: text } });
  view.fixture.detectChanges();
}

describe('CommandPaletteComponent', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('is closed until it is opened', async () => {
    await setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on Ctrl+K and closes on Escape', async () => {
    const view = await setup();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    view.fixture.detectChanges();
    expect(screen.getByRole('dialog', { name: 'Suche' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    view.fixture.detectChanges();
    expect(view.palette.isOpen()).toBe(false);
  });

  it('opens on Cmd+K too, for a Mac, and toggles', async () => {
    const view = await setup();
    fireEvent.keyDown(document, { key: 'K', metaKey: true });
    expect(view.palette.isOpen()).toBe(true);
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(view.palette.isOpen()).toBe(false);
  });

  it('shows the rows of the app under their group labels, with the kit placeholder', async () => {
    const view = await setup();
    await open(view);
    expect(field()).toHaveAttribute('placeholder', 'Suchen …');
    view.host.records.set(RECORDS);
    await type(view, 'a');
    const pages = screen.getByRole('group', { name: 'Seiten' });
    expect(within(pages).getByRole('option')).toHaveTextContent('Aufgaben');
    const apps = screen.getByRole('group', { name: 'Anträge' });
    expect(within(apps).getAllByRole('option')).toHaveLength(2);
  });

  it('badges an archived row and shows a status subtitle as status text', async () => {
    const view = await setup();
    await open(view);
    view.host.records.set(RECORDS);
    await type(view, 'zz');
    const [current, archived] = within(screen.getByRole('group', { name: 'Anträge' })).getAllByRole(
      'option',
    );
    expect(current.querySelector('app-status-text')).toHaveTextContent('In Prüfung');
    expect(current).not.toHaveTextContent('Archiviert');
    expect(archived).toHaveTextContent('Archiviert');
  });

  it('marks the matching letters in titles and subtitles', async () => {
    const view = await setup();
    await open(view);
    await type(view, 'auf');
    expect(
      document.getElementById('palette-option-page--tasks')?.querySelector('mark'),
    ).toHaveTextContent('Auf');
  });

  it('moves the highlight with the arrow keys and picks the row on Enter', async () => {
    const view = await setup();
    await open(view);
    view.host.records.set(RECORDS);
    await type(view, 'a');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(field()).toHaveAttribute('aria-activedescendant', options[0].id);
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    view.fixture.detectChanges();
    expect(field()).toHaveAttribute('aria-activedescendant', options[1].id);
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    view.fixture.detectChanges();
    expect(field()).toHaveAttribute('aria-activedescendant', options[options.length - 1].id);
    fireEvent.keyDown(field(), { key: 'Enter' });
    view.fixture.detectChanges();
    expect(view.host.picked.map((r) => r.id)).toEqual(['application:2']);
    expect(view.nav).toHaveBeenCalledWith('/applications/2');
    expect(view.palette.isOpen()).toBe(false);
  });

  it('navigates by URL on a click, so a row can carry a query string', async () => {
    const view = await setup();
    await open(view);
    view.host.records.set(RECORDS);
    await type(view, 'zz');
    await userEvent.click(screen.getByRole('option', { name: /Lastenrad/ }));
    expect(view.nav).toHaveBeenCalledWith('/applications/1?tab=history');
  });

  it('emits a row without a link and opens nothing', async () => {
    const view = await setup();
    await open(view);
    view.host.records.set([{ id: 'x', icon: 'file', title: 'Ohne Ziel' }]);
    await type(view, 'zz');
    await userEvent.click(screen.getByRole('option', { name: /Ohne Ziel/ }));
    expect(view.host.picked.map((r) => r.id)).toEqual(['x']);
    expect(view.nav).not.toHaveBeenCalled();
  });

  it('reports nothing found rather than staying blank, but not below the floor or while loading', async () => {
    const view = await setup();
    await open(view);
    await type(view, 'q');
    expect(screen.queryByText('Nichts gefunden.')).not.toBeInTheDocument();
    await type(view, 'qq');
    expect(screen.getByText('Nichts gefunden.')).toBeInTheDocument();
    view.host.loading.set(true);
    view.fixture.detectChanges();
    expect(screen.queryByText('Nichts gefunden.')).not.toBeInTheDocument();
    expect(view.container.querySelector('.pal__spinner')).not.toBeNull();
  });

  it('says so when a source had more than it returned', async () => {
    const view = await setup();
    await open(view);
    view.host.truncated.set(true);
    await type(view, 'auf');
    expect(
      screen.getByText('Es gibt weitere Treffer. Suchbegriff eingrenzen.'),
    ).toBeInTheDocument();
  });

  it('starts each opening from a clean field', async () => {
    const view = await setup();
    await open(view);
    await type(view, 'auf');
    view.palette.close();
    view.fixture.detectChanges();
    await open(view);
    expect(field()).toHaveValue('');
    expect(view.host.query()).toBe('');
  });

  it('gives the focus back to where it was when it closes', async () => {
    const view = await setup();
    const before = screen.getByRole('button', { name: 'Vorher' });
    before.focus();
    await open(view);
    await new Promise((r) => setTimeout(r));
    expect(field()).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Suche schließen' }));
    view.fixture.detectChanges();
    expect(before).toHaveFocus();
  });

  it('keeps Tab inside the dialog', async () => {
    const view = await setup();
    await open(view);
    await new Promise((r) => setTimeout(r));
    const close = screen.getByRole('button', { name: 'Suche schließen' });
    fireEvent.keyDown(field(), { key: 'Tab' });
    expect(field()).toHaveFocus();
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab' });
    expect(field()).toHaveFocus();
    fireEvent.keyDown(field(), { key: 'Tab', shiftKey: true });
    expect(close).toHaveFocus();
  });

  it('has no a11y violations with results open', async () => {
    const view = await setup();
    await open(view);
    view.host.records.set(RECORDS);
    await type(view, 'a');
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
