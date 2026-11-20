import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
  it('shows the public header without rail and account menu for nobody', async () => {
    const { action } = await setUp({
      ...minimalConfig(),
      publicHead: { actions: signal([{ key: 'login', label: 'Anmelden' }]) },
    });
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
    expect(screen.getByRole('link', { name: 'Demo, Start' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Barrierefreiheit' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(action).toHaveBeenCalledWith('login');
  });

  it('shows the a11y and help menus in the rail frame', async () => {
    await setUp(fullConfig());
    expect(screen.getAllByRole('button', { name: 'Barrierefreiheit' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Hilfe' }).length).toBeGreaterThan(0);
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

  it('shows the public frame of a public route that was open before the shell rendered', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'about', component: StubPage, data: { frame: 'public' } }]),
        provideFramework(fullConfig()),
      ],
    });
    await TestBed.inject(Router).navigateByUrl('/about');
    const fixture = TestBed.createComponent(FrameworkShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-framework-public-header')).not.toBeNull();
  });
});
