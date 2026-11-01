import { render, screen } from '@testing-library/angular';
import { LockedFieldComponent } from './locked-field.component';

describe('LockedFieldComponent', () => {
  it('shows the label with a lock and the projected value', async () => {
    const { container } = await render(
      `<app-locked-field label="Haushaltsjahr">HHJ 2026</app-locked-field>`,
      { imports: [LockedFieldComponent] },
    );
    expect(container.querySelector('.lfld__label app-icon')).not.toBeNull();
    expect(container.querySelector('.lfld__label')).toHaveTextContent('Haushaltsjahr');
    expect(screen.getByText('HHJ 2026')).toHaveClass('lfld__value');
    expect(container.querySelector('input, button, [tabindex]')).toBeNull();
  });

  it('shows a value taken from elsewhere on the selection surface', async () => {
    const { container } = await render(
      `<app-locked-field label="Belegnummer" filled>RE-1</app-locked-field>
       <app-locked-field label="Haushaltsjahr">2026</app-locked-field>`,
      { imports: [LockedFieldComponent] },
    );
    const boxes = container.querySelectorAll('.lfld');
    expect(boxes[0]).toHaveClass('lfld--filled');
    expect(boxes[1]).not.toHaveClass('lfld--filled');
  });
});
