import { Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ChipGroupComponent, type ChipOption } from './chip-group.component';

const OPTIONS: ChipOption[] = [
  { value: '', label: 'Keine Angabe' },
  { value: 'bar', label: 'Bar' },
  { value: 'karte', label: 'Karte' },
];

@Component({
  standalone: true,
  imports: [ChipGroupComponent],
  template: `<span id="cap">Zahlungsart</span>
    <app-chip-group ariaLabelledby="cap" [options]="options" [(value)]="value" />`,
})
class Host {
  readonly options = OPTIONS;
  readonly value = signal<string | null>('bar');
}

describe('ChipGroupComponent', () => {
  it('is a labelled radio group, the chosen chip checked and marked', async () => {
    await render(Host);
    expect(screen.getByRole('radiogroup', { name: 'Zahlungsart' })).toBeInTheDocument();
    const bar = screen.getByRole('radio', { name: 'Bar' });
    expect(bar).toHaveAttribute('aria-checked', 'true');
    expect(bar).toHaveClass('chip', 'on');
    expect(bar.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Karte' })).toHaveAttribute('aria-checked', 'false');
  });

  it('chooses with a click', async () => {
    const view = await render(Host);
    await userEvent.click(screen.getByRole('radio', { name: 'Karte' }));
    expect(view.fixture.componentInstance.value()).toBe('karte');
    expect(screen.getByRole('radio', { name: 'Karte' })).toHaveAttribute('aria-checked', 'true');
  });

  it('has one tab stop and moves the choice with the arrow keys, Home and End', async () => {
    const view = await render(Host);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
    expect(view.fixture.componentInstance.value()).toBe('karte');
    expect(radios[2]).toHaveFocus();
    fireEvent.keyDown(radios[2], { key: 'ArrowRight' });
    expect(view.fixture.componentInstance.value()).toBe('');
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' });
    expect(view.fixture.componentInstance.value()).toBe('karte');
    fireEvent.keyDown(radios[2], { key: 'Home' });
    expect(view.fixture.componentInstance.value()).toBe('');
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(view.fixture.componentInstance.value()).toBe('karte');
    fireEvent.keyDown(radios[2], { key: 'ArrowUp' });
    expect(view.fixture.componentInstance.value()).toBe('bar');
    fireEvent.keyDown(radios[1], { key: 'ArrowDown' });
    expect(view.fixture.componentInstance.value()).toBe('karte');
    fireEvent.keyDown(radios[2], { key: 'a' });
    expect(view.fixture.componentInstance.value()).toBe('karte');
  });

  it('puts the tab stop on the first chip without a choice, and can leave out the check', async () => {
    await render(
      `<app-chip-group ariaLabel="Gültigkeit" [check]="false" [options]="options" [value]="'karte'" />
       <app-chip-group ariaLabel="Leer" [options]="options" [value]="null" />`,
      { imports: [ChipGroupComponent], componentProperties: { options: OPTIONS } },
    );
    const group = screen.getByRole('radiogroup', { name: 'Gültigkeit' });
    expect(group.querySelector('[data-icon="check"]')).toBeNull();
    const empty = screen.getByRole('radiogroup', { name: 'Leer' });
    expect(empty.querySelector('[tabindex="0"]')).toHaveTextContent('Keine Angabe');
  });
});
