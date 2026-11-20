import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DisplaySettingsService, type Action } from '@stupa-makers/ui-kit';

import { ShellMenuComponent, type ShellMenuKind } from './shell-menu.component';
import { runAxe } from '../../../testing/a11y';

async function setUp(menu: ShellMenuKind, items: readonly Action[] = [], reportBarrier = false) {
  const action = jest.fn();
  const view = await render(ShellMenuComponent, {
    inputs: { variant: 'sheet', menu, items, statementLink: { commands: ['/a11y'] }, reportBarrier },
    on: { action },
    providers: [provideRouter([{ path: '**', children: [] }])],
  });
  return { view, action };
}

// §S/framework/shell/002264
describe('ShellMenuComponent', () => {
  afterEach(() => localStorage.clear());

  it('shows the display switches and the statement link in the a11y menu', async () => {
    await setUp('a11y');
    for (const name of ['Dunkles Design', 'Weniger Bewegung', 'Weniger Transparenz', 'Mehr Kontrast', 'Hoher Kontrast']) {
      expect(screen.getByRole('switch', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Erklärung zur Barrierefreiheit' })).toHaveAttribute(
      'href',
      '/a11y',
    );
  });

  it('sets a display choice and offers the reset only while a choice exists', async () => {
    await setUp('a11y');
    const display = TestBed.inject(DisplaySettingsService);
    expect(screen.queryByRole('button', { name: 'Systemeinstellungen verwenden' })).toBeNull();
    await userEvent.click(screen.getByRole('switch', { name: 'Weniger Bewegung' }));
    expect(display.hasChoice()).toBe(true);
    await userEvent.click(await screen.findByRole('button', { name: 'Systemeinstellungen verwenden' }));
    expect(display.hasChoice()).toBe(false);
  });

  it('shows the help items: a link with its address and a button that emits its key', async () => {
    const { action } = await setUp('help', [
      { key: 'wiki', label: 'Handbuch im Wiki', href: 'https://wiki.example.org/x' },
      { key: 'report', label: 'Problem melden' },
    ]);
    expect(screen.getByText('wiki.example.org/x')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Problem melden' }));
    expect(action).toHaveBeenCalledWith('report');
  });

  // §S/framework/shell/002292
  it('shows "Barriere melden" only when asked, and emits reportBarrier', async () => {
    const { action } = await setUp('a11y', [], true);
    await userEvent.click(screen.getByRole('button', { name: 'Barriere melden' }));
    expect(action).toHaveBeenCalledWith('reportBarrier');
  });

  it('hides "Barriere melden" by default', async () => {
    await setUp('a11y');
    expect(screen.queryByRole('button', { name: 'Barriere melden' })).toBeNull();
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations in the a11y menu', async () => {
    const { view } = await setUp('a11y', [], true);
    expect(await runAxe(view.container)).toHaveNoViolations();
  });

  it('has no axe violations in the help menu', async () => {
    const { view } = await setUp('help', [{ key: 'report', label: 'Problem melden' }]);
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
