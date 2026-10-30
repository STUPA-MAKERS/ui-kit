import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { FabGroupComponent } from './fab-group.component';
import { FabComponent } from './fab.component';

async function setup(template: string, props: Record<string, unknown> = {}) {
  return render(template, {
    imports: [FabComponent],
    componentProperties: props,
  });
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
    await setup(`<app-fab label="New deadline" (activate)="activate()" />`, {
      activate,
    });
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
    await rerender({
      componentProperties: { activate, loading: false, disabled: true },
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await rerender({
      componentProperties: { activate, loading: false, disabled: false },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(activate).toHaveBeenCalledTimes(1);
  });
});

describe('FabComponent icon only and FabGroupComponent', () => {
  it('is a round icon button with the label as its name and title', async () => {
    const { container } = await render(`<app-fab icon="check" label="Save" [iconOnly]="true" />`, {
      imports: [FabComponent],
    });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('btn--fab');
    expect(button).toHaveClass('btn--icon');
    expect(button).toHaveAttribute('title', 'Save');
    expect(button).not.toHaveTextContent('Save');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('keeps the labelled pill without a title by default', async () => {
    await render(`<app-fab label="New meeting" />`, {
      imports: [FabComponent],
    });
    const button = screen.getByRole('button', { name: 'New meeting' });
    expect(button).not.toHaveClass('btn--icon');
    expect(button).not.toHaveAttribute('title');
  });

  it('puts several fabs side by side in a group, which takes the position', async () => {
    const reset = jest.fn();
    const save = jest.fn();
    const { container } = await render(
      `<app-fab-group>
        <app-fab icon="reset" label="Reset" [iconOnly]="true" tone="neutral" (activate)="reset()" />
        <app-fab icon="check" label="Save" [iconOnly]="true" (activate)="save()" />
      </app-fab-group>`,
      {
        imports: [FabComponent, FabGroupComponent],
        componentProperties: { reset, save },
      },
    );
    const group = screen.getByRole('group');
    const fabs = Array.from(group.querySelectorAll('app-fab'));
    expect(fabs).toHaveLength(2);
    expect(fabs.every((f) => f.classList.contains('fab--grouped'))).toBe(true);
    expect(fabs[0]).toHaveClass('fab--neutral');
    expect(fabs[1]).not.toHaveClass('fab--neutral');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('is not grouped on its own', async () => {
    const { container } = await render(`<app-fab label="New" />`, {
      imports: [FabComponent],
    });
    expect(container.querySelector('app-fab')).not.toHaveClass('fab--grouped');
  });
});
