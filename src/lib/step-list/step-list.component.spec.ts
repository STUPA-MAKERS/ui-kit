import { render, screen } from '@testing-library/angular';

import { StepListComponent, StepRowComponent } from './step-list.component';

describe('StepListComponent', () => {
  it('lists the rows with their number, main field, actions and fields; other content follows', async () => {
    const { container } = await render(
      `<app-step-list>
        <app-step-row [number]="1" [columns]="2">
          <input stepMain aria-label="Name 1" />
          <button stepActions type="button">Löschen</button>
          <input stepField aria-label="Phase 1" />
          <input stepField aria-label="Farbe 1" />
        </app-step-row>
        <app-step-row [number]="2">
          <input stepMain aria-label="Name 2" />
        </app-step-row>
        <p>Hinweis</p>
      </app-step-list>`,
      { imports: [StepListComponent, StepRowComponent] },
    );
    const list = screen.getByRole('list');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items.every((item) => list.contains(item))).toBe(true);
    expect(items[0].querySelector('.steprow__no')?.textContent).toBe('1');
    expect(items[0].querySelector('.steprow__no')?.getAttribute('aria-hidden')).toBe('true');
    expect(items[0].querySelector('.steprow__main input')).not.toBeNull();
    expect(items[0].querySelector('.steprow__actions button')).not.toBeNull();
    expect(items[0].querySelectorAll('.steprow__fields input')).toHaveLength(2);
    const fields = items[0].querySelector<HTMLElement>('.steprow__fields');
    expect(fields?.style.getPropertyValue('--steprow-columns')).toBe('2');
    expect(items[1].querySelector('.steprow__fields')?.childElementCount).toBe(0);
    expect(list.contains(screen.getByText('Hinweis'))).toBe(false);
    expect(container.querySelector('app-step-list > p')).not.toBeNull();
  });

  it('leaves out the number of a row in a list without an order', async () => {
    await render(
      `<app-step-list>
        <app-step-row>
          <input stepMain aria-label="Name" />
        </app-step-row>
      </app-step-list>`,
      { imports: [StepListComponent, StepRowComponent] },
    );
    const item = screen.getByRole('listitem');
    expect(item.querySelector('.steprow__no')).toBeNull();
    expect(item.classList).toContain('steprow--plain');
  });
});
