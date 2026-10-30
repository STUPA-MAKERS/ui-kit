import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideUiKit } from '@stupa-makers/ui-kit';
import { runAxe } from '../../testing/a11y';
import { SwUpdatePromptComponent } from './sw-update-prompt.component';
import { SwUpdateService } from './sw-update.service';

describe('SwUpdatePromptComponent', () => {
  async function setup(ready: boolean) {
    const updateReady = signal(ready);
    const reload = jest.fn();
    const view = await render(SwUpdatePromptComponent, {
      providers: [
        provideUiKit({ lang: signal('en' as const) }),
        { provide: SwUpdateService, useValue: { updateReady, reload } },
      ],
    });
    return { view, updateReady, reload };
  }

  it('shows nothing while no update is ready', async () => {
    await setup(false);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the persistent prompt with a reload button once an update is ready', async () => {
    const { view, updateReady } = await setup(false);
    updateReady.set(true);
    view.fixture.detectChanges();
    expect(screen.getByRole('status')).toHaveTextContent('A new version of the app is available.');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(await runAxe(view.container)).toHaveNoViolations();
  });

  it('speaks German by default', async () => {
    const { container } = await render(SwUpdatePromptComponent, {
      providers: [{ provide: SwUpdateService, useValue: { updateReady: signal(true), reload: jest.fn() } }],
    });
    expect(container.textContent).toContain('Eine neue Version der App ist verfügbar.');
    expect(screen.getByRole('button', { name: 'Neu laden' })).toBeInTheDocument();
  });

  it('reloads the page on a click on the reload button', async () => {
    const { reload } = await setup(true);
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
