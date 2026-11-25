import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import type { SearchDef } from '../screen/screen.types';
import { SelectSheetComponent, type SelectSheetOption } from './select-sheet.component';

const OPTIONS: readonly SelectSheetOption[] = [
  { value: 'a-1', label: 'Antrag Sommerfest', sub: 'Mo., 23.11.' },
  { value: 'a-2', label: 'Antrag Exkursion' },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SelectSheetComponent],
  template: `
    <app-select-sheet
      [(open)]="open"
      heading="TOP hinzufügen"
      subtitle="Sitzung vom 1. Dezember"
      [options]="options()"
      [(value)]="value"
      [(values)]="values"
      [multi]="multi()"
      [search]="search()"
      [(query)]="query"
      listLabel="Anträge"
      emptyHeading="Keine Anträge"
      submitLabel="Hinzufügen"
      submitIcon="plus"
      [busy]="busy()"
      (picked)="picked.push($event)"
    />
  `,
})
class Host {
  readonly open = signal(true);
  readonly options = signal<readonly SelectSheetOption[] | null>(OPTIONS);
  readonly value = signal<string | null>(null);
  readonly values = signal<readonly string[]>([]);
  readonly multi = signal(false);
  readonly search = signal<SearchDef | null>({ placeholder: 'Anträge suchen' });
  readonly query = signal('');
  readonly busy = signal(false);
  readonly picked: (string | readonly string[])[] = [];
}

async function setup(configure?: (h: Host) => void) {
  const view = await render(Host);
  const host = view.fixture.componentInstance;
  configure?.(host);
  view.fixture.detectChanges();
  return { view, host, user: userEvent.setup() };
}

const submit = () => screen.getByRole('button', { name: /Hinzufügen/ });

describe('SelectSheetComponent', () => {
  it('lists the rows as select-sheet tiles with a check after the chosen one (001790)', async () => {
    await setup((h) => h.value.set('a-2'));
    const list = screen.getByRole('radiogroup', { name: 'Anträge' });
    expect(list.classList).toContain('rowgroup--bg3');
    const rows = screen.getAllByTestId('select-sheet-row');
    expect(rows.map((r) => r.querySelector('.sel__check') !== null)).toEqual([false, true]);
    expect(rows[1].classList).toContain('sel__row--on');
    expect(screen.getByText('Mo., 23.11.')).toBeTruthy();
    expect(screen.getByText('Sitzung vom 1. Dezember')).toBeTruthy();
  });

  it('picks one row and hands it on with the main action', async () => {
    const { host, user, view } = await setup();
    expect(submit()).toBeDisabled();
    await user.click(screen.getByText('Antrag Exkursion'));
    view.fixture.detectChanges();
    expect(host.value()).toBe('a-2');
    await user.click(submit());
    expect(host.picked).toEqual(['a-2']);
  });

  it('picks several rows with multi', async () => {
    const { host, user, view } = await setup((h) => h.multi.set(true));
    expect(screen.getByRole('group', { name: 'Anträge' })).toBeTruthy();
    await user.click(screen.getByText('Antrag Sommerfest'));
    await user.click(screen.getByText('Antrag Exkursion'));
    view.fixture.detectChanges();
    expect(host.values()).toEqual(['a-1', 'a-2']);
    await user.click(screen.getByText('Antrag Sommerfest'));
    view.fixture.detectChanges();
    await user.click(submit());
    expect(host.picked).toEqual([['a-2']]);
  });

  it('hands on nothing while it works', async () => {
    const { host } = await setup((h) => {
      h.value.set('a-1');
      h.busy.set(true);
    });
    expect(submit()).toBeDisabled();
    expect(host.picked).toEqual([]);
  });

  it('writes the search text to query', async () => {
    const { host, user } = await setup();
    await user.type(screen.getByPlaceholderText('Anträge suchen'), 'Fest');
    expect(host.query()).toBe('Fest');
  });

  it('shows skeleton rows while it loads and the empty state without a row', async () => {
    const { host, view } = await setup((h) => h.options.set(null));
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.getByText('Wird geladen…')).toBeTruthy();
    host.options.set([]);
    view.fixture.detectChanges();
    expect(screen.getByText('Keine Anträge')).toBeTruthy();
  });

  it('closes on Abbrechen', async () => {
    const { host, user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(host.open()).toBe(false);
  });

  it('has no axe violations', async () => {
    const { view } = await setup((h) => h.value.set('a-1'));
    expect(await runAxe(view.container.ownerDocument.body)).toHaveNoViolations();
  });
});
