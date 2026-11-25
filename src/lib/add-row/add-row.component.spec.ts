import { fireEvent, render, screen } from '@testing-library/angular';

import { AddRowComponent } from './add-row.component';

describe('AddRowComponent', () => {
  it('is one button with a plus and the text, and adds on a click', async () => {
    const add = jest.fn();
    const { container } = await render(
      `<app-add-row (add)="add()">Position hinzufügen</app-add-row>`,
      { imports: [AddRowComponent], componentProperties: { add } },
    );
    const button = screen.getByRole('button', { name: 'Position hinzufügen' });
    expect(container.querySelector('.addrow app-icon')).not.toBeNull();
    fireEvent.click(button);
    expect(add).toHaveBeenCalledTimes(1);
  });
});
