import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { FabComponent } from './fab.component';

async function setup(template: string, props: Record<string, unknown> = {}) {
  return render(template, { imports: [FabComponent], componentProperties: props });
}

describe('FabComponent', () => {
  it('is one fab button with the plus icon and its label as the name', async () => {
    const { container } = await setup(`<app-fab label="New committee" />`);
    const button = screen.getByRole('button', { name: 'New committee' });
    expect(button).toHaveClass('btn--fab');
    expect(button).toHaveTextContent('New committee');
    expect(container.querySelector('app-icon')).toBeTruthy();
    expect(container.querySelector('app-fab')).toHaveClass('fab');
    expect(container.querySelector('app-fab')).not.toHaveClass('fab--contained');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('emits activate on a click and from the keyboard', async () => {
    const activate = jest.fn();
    await setup(`<app-fab label="New deadline" (activate)="activate()" />`, { activate });
    await userEvent.click(screen.getByRole('button', { name: 'New deadline' }));
    expect(activate).toHaveBeenCalledTimes(1);
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'New deadline' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(activate).toHaveBeenCalledTimes(2);
  });

  it('marks the contained mode on the host', async () => {
    const { container } = await setup(`<app-fab label="New meeting" [contained]="true" />`);
    expect(container.querySelector('app-fab')).toHaveClass('fab--contained');
  });

  it('is the save action with the check icon, and takes no click while it saves or is disabled', async () => {
    const activate = jest.fn();
    const { rerender } = await setup(
      `<app-fab icon="check" label="Save" [loading]="loading" [disabled]="disabled" (activate)="activate()" />`,
      { activate, loading: true, disabled: false },
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    await rerender({ componentProperties: { activate, loading: false, disabled: true } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await rerender({ componentProperties: { activate, loading: false, disabled: false } });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
