import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AutocompleteComponent } from './autocomplete.component';

interface Hit {
  id: string;
  title: string;
}

@Component({
  selector: 'app-ac-host',
  standalone: true,
  imports: [AutocompleteComponent],
  template: `
    <app-autocomplete
      inputId="ac-test"
      label="Antrag"
      clearLabel="Verknüpfung lösen"
      [query]="query()"
      [options]="hits()"
      [open]="hits().length > 0"
      [picked]="picked()"
      [optionLabel]="title"
      (queryChange)="onQuery($event)"
      (choose)="onChoose($event)"
      (cleared)="picked.set(null)"
    />
  `,
})
class Host {
  readonly query = signal('');
  readonly hits = signal<Hit[]>([]);
  readonly picked = signal<string | null>(null);
  readonly title = (h: Hit): string => h.title;
  onQuery(q: string): void {
    this.query.set(q);
    this.hits.set(q ? [{ id: 'a', title: 'Lastenrad' }, { id: 'b', title: 'Laptop' }] : []);
  }
  onChoose(h: Hit): void {
    this.picked.set(h.title);
    this.hits.set([]);
  }
}

describe('AutocompleteComponent', () => {
  it('lists the hits of the page and takes a click', async () => {
    const user = userEvent.setup();
    const view = await render(Host);
    const box = screen.getByRole('combobox', { name: 'Antrag' });
    expect(box).toHaveAttribute('aria-expanded', 'false');
    await user.type(box, 'La');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('option', { name: 'Laptop' }));
    expect(view.fixture.componentInstance.picked()).toBe('Laptop');
    expect(screen.getByText('Laptop')).toHaveClass('ac__pickedText');
    await user.click(screen.getByRole('button', { name: 'Verknüpfung lösen' }));
    expect(view.fixture.componentInstance.picked()).toBeNull();
  });

  it('moves with the arrow keys, takes Enter and closes on Escape', async () => {
    const user = userEvent.setup();
    const view = await render(Host);
    const box = screen.getByRole('combobox', { name: 'Antrag' });
    await user.type(box, 'L');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    const active = screen.getByRole('option', { name: 'Laptop' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(box).toHaveAttribute('aria-activedescendant', active.id);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Lastenrad' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Laptop' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(view.fixture.componentInstance.picked()).toBe('Laptop');
  });
});
