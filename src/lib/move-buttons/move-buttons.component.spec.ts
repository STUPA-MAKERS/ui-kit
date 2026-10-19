import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MoveButtonsComponent } from './move-buttons.component';
import { moveItem } from './move-item';

describe('moveItem', () => {
  it('swaps an item with its neighbour', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('keeps the list at an edge or for an index outside it, as a new array', () => {
    const list = ['a', 'b'];
    const top = moveItem(list, 0, -1);
    expect(top).toEqual(['a', 'b']);
    expect(top).not.toBe(list);
    expect(moveItem(list, 1, 1)).toEqual(['a', 'b']);
    expect(moveItem(list, 5, -1)).toEqual(['a', 'b']);
    expect(moveItem(list, -1, 1)).toEqual(['a', 'b']);
  });
});

describe('MoveButtonsComponent', () => {
  it('renders two named icon buttons that emit the direction', async () => {
    const move = jest.fn();
    await render(`<app-move-buttons (move)="move($event)" />`, {
      imports: [MoveButtonsComponent],
      componentProperties: { move },
    });
    const up = screen.getByRole('button', { name: 'Nach oben' });
    const down = screen.getByRole('button', { name: 'Nach unten' });
    expect(up).toHaveAttribute('title', 'Nach oben');
    expect(up.querySelector('[data-icon="up"]')).not.toBeNull();
    expect(down.querySelector('[data-icon="down"]')).not.toBeNull();
    await userEvent.click(up);
    await userEvent.click(down);
    expect(move.mock.calls).toEqual([[-1], [1]]);
  });

  it('takes own names and disables an edge', async () => {
    await render(
      `<app-move-buttons upLabel="Nach oben: Spalte 1" downLabel="Nach unten: Spalte 1" [upDisabled]="true" />`,
      { imports: [MoveButtonsComponent] },
    );
    expect(screen.getByRole('button', { name: 'Nach oben: Spalte 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Nach unten: Spalte 1' })).toBeEnabled();
  });
});
