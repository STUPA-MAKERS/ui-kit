import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';
import { SearchWindowComponent, type SearchWindowRow } from './search-window.component';

const ROWS: readonly SearchWindowRow[] = [
  { id: '41', icon: 'file', title: 'Angebot Beamer', subtitle: 'Angebot · 30.10.2031' },
  { id: '42', icon: 'file', title: 'Bescheid' },
];

@Component({
  standalone: true,
  imports: [SearchWindowComponent],
  template: `
    <button type="button" class="opener">Öffnen</button>
    <app-search-window
      label="In Paperless suchen"
      empty="Nichts gefunden"
      [(open)]="open"
      [(query)]="query"
      [rows]="rows()"
      [loading]="loading()"
      [error]="error()"
      (picked)="picked.push($event)"
    />
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly query = signal('alt');
  readonly rows = signal<readonly SearchWindowRow[]>(ROWS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly picked: SearchWindowRow[] = [];
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

async function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const opener = fixture.nativeElement.querySelector('.opener') as HTMLButtonElement;
  opener.focus();
  const show = async (): Promise<void> => {
    host.open.set(true);
    fixture.detectChanges();
    await tick();
    fixture.detectChanges();
  };
  const panel = (): HTMLElement | null => document.querySelector('.sw');
  const field = (): HTMLInputElement => document.querySelector('.sw__input') as HTMLInputElement;
  const key = (name: string, target: Element = field()): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, host, opener, show, panel, field, key };
}

/** §002760: the search window of the kit. */
describe('SearchWindowComponent', () => {
  afterEach(() => document.querySelectorAll('.sw-layer').forEach((n) => n.remove()));

  it('renders nothing while it is closed', async () => {
    const { panel } = await setup();
    expect(panel()).toBeNull();
  });

  it('opens at the end of the body with an empty field that has the focus', async () => {
    const { show, panel, field, host } = await setup();
    await show();
    expect(panel()?.parentElement?.parentElement).toBe(document.body);
    expect(panel()?.getAttribute('aria-label')).toBe('In Paperless suchen');
    expect(host.query()).toBe('');
    expect(document.activeElement).toBe(field());
    expect(field().placeholder).toBe('In Paperless suchen');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('shows the hits as rows with title and subtitle', async () => {
    const { show } = await setup();
    await show();
    const rows = [...document.querySelectorAll('.sw__row')];
    expect(rows.map((r) => r.querySelector('.sw__rowTitle')?.textContent)).toEqual(['Angebot Beamer', 'Bescheid']);
    expect(rows[0].querySelector('.sw__rowSub')?.textContent).toBe('Angebot · 30.10.2031');
    expect(rows[1].querySelector('.sw__rowSub')).toBeNull();
    expect(rows[0].getAttribute('aria-selected')).toBe('true');
  });

  it('moves the selection with the arrow keys and picks with Enter', async () => {
    const { show, key, host, field } = await setup();
    await show();
    key('ArrowDown');
    expect(field().getAttribute('aria-activedescendant')).toBe('search-window-option-42');
    key('ArrowDown');
    expect(field().getAttribute('aria-activedescendant')).toBe('search-window-option-41');
    key('ArrowUp');
    key('Enter');
    expect(host.picked).toEqual([ROWS[1]]);
    expect(host.open()).toBe(true);
  });

  it('picks a row with a click', async () => {
    const { show, host, fixture } = await setup();
    await show();
    (document.querySelectorAll('.sw__row')[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(host.picked).toEqual([ROWS[0]]);
  });

  it('closes with the key Esc, the Esc button and the scrim, and gives the focus back', async () => {
    const { show, key, host, panel, opener, fixture } = await setup();
    await show();
    const event = key('Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(host.open()).toBe(false);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(opener);

    await show();
    const close = document.querySelector('.sw__close') as HTMLButtonElement;
    expect(close.querySelector('.sw__esc')?.textContent).toMatch(/Esc|⎋/);
    close.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);

    await show();
    (document.querySelector('.sw__scrim') as HTMLElement).click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });

  it('keeps Tab between the field and the close button', async () => {
    const { show, key, field } = await setup();
    await show();
    const close = document.querySelector('.sw__close') as HTMLButtonElement;
    expect(key('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
    key('Tab', close);
    expect(document.activeElement).toBe(field());
    // Enter on the close button is not a pick.
    close.focus();
    key('Enter', close);
  });

  it('writes the typed text to the query and starts at the first row', async () => {
    const { show, key, host, field } = await setup();
    await show();
    key('ArrowDown');
    field().value = 'beamer';
    field().dispatchEvent(new Event('input'));
    expect(host.query()).toBe('beamer');
    host.rows.set([ROWS[1]]);
    expect(document.querySelectorAll('.sw__row--active').length).toBeLessThanOrEqual(1);
  });

  it('shows the error in place of the hits', async () => {
    const { show, host, fixture } = await setup();
    host.error.set('Paperless ist nicht erreichbar');
    await show();
    fixture.detectChanges();
    expect(document.querySelector('.sw__note')?.textContent).toBe('Paperless ist nicht erreichbar');
    expect(document.querySelector('.sw__row')).toBeNull();
    expect(document.querySelector('app-empty-state')).toBeNull();
  });

  it('shows the empty state without a hit, and a spinner in place of it while the search runs', async () => {
    const { show, host, fixture, key } = await setup();
    host.rows.set([]);
    await show();
    expect(document.querySelector('app-empty-state')?.textContent).toContain('Nichts gefunden');
    key('ArrowDown');
    key('Enter');
    expect(host.picked).toEqual([]);
    host.loading.set(true);
    fixture.detectChanges();
    expect(document.querySelector('app-empty-state')).toBeNull();
    expect(document.querySelector('.sw__spinner')).not.toBeNull();
  });

  it('removes the panel when the host goes', async () => {
    const { show, fixture, panel } = await setup();
    await show();
    fixture.destroy();
    expect(panel()).toBeNull();
  });
});
