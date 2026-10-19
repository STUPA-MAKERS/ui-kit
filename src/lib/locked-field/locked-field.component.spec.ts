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
});
