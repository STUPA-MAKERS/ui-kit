import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { fakePorts, fullConfig, minimalConfig } from '../../../testing/framework';
import { provideFramework, type FrameworkConfig } from './framework';
import { FrameworkShellComponent } from './framework-shell.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<h1>Seite</h1>',
})
class StubPage {}

async function setUp(config: FrameworkConfig) {
  const action = jest.fn();
  const view = await render(FrameworkShellComponent, {
    providers: [
      provideRouter([{ path: '**', component: StubPage }]),
      provideFramework(config),
    ],
    on: { action },
  });
  return { view, action };
}

// §S/framework/shell/002263
describe('FrameworkShellComponent', () => {
  it('shows the public frame without rail and account menu for nobody', async () => {
    await setUp(minimalConfig());
    expect(screen.queryByRole('navigation', { name: 'Hauptnavigation' })).toBeNull();
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
  });

  it('shows the entries of the config in the rail frame', async () => {
    await setUp(fullConfig());
    expect(screen.getAllByRole('link', { name: /Anträge/ }).length).toBeGreaterThan(0);
  });

  it('shows a mark of the navMarks port as hidden text, never as a count', async () => {
    const config = fullConfig();
    await setUp({
      ...config,
      ports: fakePorts({ navMarks: signal({ applications: 'new' }) }),
    });
    expect(screen.getAllByText('neu').length).toBeGreaterThan(0);
  });

  // §S/framework/shell/002264
  it('emits the key of an account item without a route', async () => {
    const config = fullConfig();
    const { action } = await setUp({
      ...config,
      account: { items: signal([{ key: 'export', label: 'Daten exportieren' }]) },
    });
    const user = userEvent.setup();
    const trigger = screen.queryByRole('button', { name: /Ada Lovelace/ });
    if (trigger) await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Daten exportieren' }));
    expect(action).toHaveBeenCalledWith('export');
  });
});
