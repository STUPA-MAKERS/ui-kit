import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { runAxe } from '../../../testing/a11y';
import { fullConfig } from '../../../testing/framework';
import { provideFramework } from './framework';
import { FrameworkPublicHeaderComponent } from './framework-public-header.component';

async function setUp() {
  const action = jest.fn();
  const config = {
    ...fullConfig(),
    reportBarrier: true,
    publicHead: { actions: signal([{ key: 'signIn', label: 'Anmelden' }]) },
  };
  const view = await render(FrameworkPublicHeaderComponent, {
    providers: [provideRouter([]), provideFramework(config)],
    on: { action },
  });
  return { view, action };
}

// §S/framework/shell/002260
describe('FrameworkPublicHeaderComponent', () => {
  it('shows the menus, the language and the actions of the config', async () => {
    const { action } = await setUp();
    expect(screen.getByRole('button', { name: 'Barrierefreiheit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hilfe' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(action).toHaveBeenCalledWith('signIn');
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations', async () => {
    const { view } = await setUp();
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
