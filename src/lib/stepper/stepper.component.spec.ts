import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { StepperComponent } from './stepper.component';

const STEPS = [{ label: 'Antragsteller' }, { label: 'Angaben' }, { label: 'Prüfen' }];

describe('StepperComponent', () => {
  it('renders all steps within a labelled list', async () => {
    await render(StepperComponent, { inputs: { steps: STEPS, activeIndex: 1 } });
    expect(screen.getByRole('list', { name: 'Fortschritt' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks the active step with aria-current', async () => {
    await render(StepperComponent, { inputs: { steps: STEPS, activeIndex: 1 } });
    const current = screen.getByText('Angaben').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
  });

  it('shows a check for a done step and the number for the others', async () => {
    const { container } = await render(StepperComponent, {
      inputs: { steps: STEPS, activeIndex: 1 },
    });
    const markers = container.querySelectorAll('.stepper__marker');
    expect(markers[0].querySelector('[data-icon="check"]')).not.toBeNull();
    expect(markers[1].textContent?.trim()).toBe('2');
    expect(markers[2].textContent?.trim()).toBe('3');
  });

  it('shows the hints only in the vertical layout', async () => {
    const steps = [{ label: 'Antragsart', hint: 'Förderantrag' }, { label: 'Angaben' }];
    const { container, rerender } = await render(StepperComponent, {
      inputs: { steps, activeIndex: 1 },
    });
    expect(screen.queryByText('Förderantrag')).toBeNull();
    await rerender({ inputs: { steps, activeIndex: 1, orientation: 'vertical' } });
    expect(screen.getByText('Förderantrag')).toHaveAttribute('title', 'Förderantrag');
    expect(container.querySelector('.stepper--vertical')).not.toBeNull();
  });

  it('has no buttons unless it is navigable', async () => {
    await render(StepperComponent, { inputs: { steps: STEPS, activeIndex: 2 } });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('emits the index of a done step on a click when navigable', async () => {
    const picked: number[] = [];
    await render(StepperComponent, {
      inputs: { steps: STEPS, activeIndex: 1, navigable: true },
      on: { stepSelect: (i: number) => picked.push(i) },
    });
    // Only the done step is a button; the current and the next steps are not.
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]);
    expect(picked).toEqual([0]);
  });

  it('ignores a select of a step that is not done', async () => {
    const { fixture } = await render(StepperComponent, {
      inputs: { steps: STEPS, activeIndex: 1, navigable: true },
    });
    const emitted: number[] = [];
    fixture.componentInstance.stepSelect.subscribe((i) => emitted.push(i));
    (fixture.componentInstance as unknown as { select(i: number): void }).select(2);
    expect(emitted).toEqual([]);
  });
});
