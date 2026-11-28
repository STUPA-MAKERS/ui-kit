import { fireEvent, render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { ListToolbarComponent } from './list-toolbar.component';

describe('ListToolbarComponent', () => {
  it('shows the search, the projected chips and the count', async () => {
    const changed = jest.fn();
    const { container } = await render(
      `<app-list-toolbar placeholder="Protokolle durchsuchen" [count]="count" (valueChange)="changed($event)">
        <button type="button">Semester</button>
      </app-list-toolbar>`,
      { imports: [ListToolbarComponent], componentProperties: { count: '12 Protokolle', changed } },
    );
    const field = container.querySelector('input')!;
    fireEvent.input(field, { target: { value: 'Haushalt' } });
    expect(changed).toHaveBeenCalledWith('Haushalt');
    expect(screen.getByRole('button', { name: 'Semester' })).toBeTruthy();
    expect(container.querySelector('.lt__count')!.textContent).toBe('12 Protokolle');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('hides the count without one', async () => {
    const { container } = await render(`<app-list-toolbar placeholder="Suchen" [count]="null" />`, {
      imports: [ListToolbarComponent],
    });
    expect(container.querySelector('.lt__count')).toBeNull();
  });
});
