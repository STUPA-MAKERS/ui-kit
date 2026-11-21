import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ToastService } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import {
  ScreenGroupDirective,
  SettingsScreenComponent,
  type SettingsGroup,
  type SettingsSave,
  type SettingsState,
} from './settings-screen.component';

const GROUPS: readonly SettingsGroup[] = [
  { key: 'wiki', label: 'Wiki', rows: [] },
  {
    key: 'tickets',
    label: 'Tickets',
    rows: [
      { key: 'public', label: 'Tickets ohne Konto erlauben', control: 'switch', value: true },
      {
        key: 'anon',
        label: 'Erledigte Tickets anonymisieren',
        meta: 'Nach 12 Monaten',
        control: 'switch',
        value: false,
      },
      { key: 'locked', label: 'Gesperrt', control: 'switch', value: false, disabled: true },
    ],
  },
  {
    key: 'more',
    rows: [
      { key: 'version', label: 'Version', control: 'value', value: '2026.11.28' },
      { key: 'audit', label: 'Audit-Log', control: 'link', link: { commands: ['/audit'] } },
      {
        key: 'reset',
        label: 'Zurücksetzen',
        control: 'action',
        action: {
          key: 'reset',
          label: 'Zurücksetzen',
          kind: 'danger',
          confirm: { title: 'Zurücksetzen?', confirmLabel: 'Zurücksetzen' },
        },
      },
    ],
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SettingsScreenComponent, ScreenGroupDirective],
  template: `
    <div [style.width.px]="width()">
      <app-settings-screen
        [head]="{ title: 'Hilfe & Tickets' }"
        [groups]="groups"
        [state]="state()"
        [save]="save()"
        (change)="onChange($event)"
        (action)="onAction($event)"
        (save)="onSave()"
        (discard)="onDiscard()"
      >
        <ng-template screenGroup="wiki"><p>Adresse des Handbuchs</p></ng-template>
      </app-settings-screen>
    </div>
  `,
})
class Host {
  readonly width = input(1200);
  readonly groups = GROUPS;
  readonly state = signal<SettingsState>({ state: 'ready' });
  readonly save = signal<SettingsSave | null>(null);
  onChange = jest.fn();
  onAction = jest.fn();
  onSave = jest.fn();
  onDiscard = jest.fn();
}

async function setup(inputs: Partial<{ width: number }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('SettingsScreenComponent', () => {
  it('shows the title, one section per labelled group and the slot of a group', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Hilfe & Tickets' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Tickets' })).toBeTruthy();
    expect(screen.getByText('Adresse des Handbuchs')).toBeTruthy();
    expect(screen.getByText('Nach 12 Monaten')).toBeTruthy();
    expect(screen.getByText('2026.11.28')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Audit-Log/ }).getAttribute('href')).toBe('/audit');
  });

  it('reports a switch change with its key, and not for a disabled row', async () => {
    const { host } = await setup();
    await userEvent.click(screen.getByRole('switch', { name: /Erledigte Tickets/ }));
    expect(host.onChange).toHaveBeenCalledWith({ key: 'anon', value: true });
    expect(screen.getByRole('switch', { name: /Gesperrt/ }).hasAttribute('disabled')).toBe(true);
    expect(host.onChange).toHaveBeenCalledTimes(1);
  });

  it('asks before an action with a confirm question', async () => {
    const { host } = await setup();
    await userEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }));
    expect(host.onAction).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      [...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Zurücksetzen')!,
    );
    expect(host.onAction).toHaveBeenCalledWith({ key: 'reset' });
  });

  it('shows Verwerfen and the save FAB only while a draft has changes', async () => {
    const { view, host } = await setup();
    expect(screen.queryByRole('button', { name: 'Speichern' })).toBeNull();
    host.save.set({ dirty: false });
    view.detectChanges();
    expect(screen.queryByRole('button', { name: 'Verwerfen' })).toBeNull();
    host.save.set({ dirty: true });
    view.detectChanges();
    await userEvent.click(await screen.findByRole('button', { name: 'Speichern' }));
    expect(host.onSave).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Verwerfen' }));
    expect(host.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('shows the labels with a grey switch while it loads', async () => {
    const { view, host } = await setup();
    host.state.set({ state: 'loading' });
    view.detectChanges();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(document.querySelectorAll('.sts__skelSwitch')).toHaveLength(3);
    expect(screen.getByRole('status').textContent).toContain('Wird geladen');
  });

  it('shows the missing right as a note', async () => {
    const { view, host } = await setup();
    host.state.set({ state: 'forbidden', message: 'Für diese Einstellungen fehlt das Recht.' });
    view.detectChanges();
    expect(screen.getByRole('alert').textContent).toContain('fehlt das Recht');
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('shows a load error as a toast with Erneut versuchen', async () => {
    const { view, host } = await setup();
    const toast = jest.spyOn(TestBed.inject(ToastService), 'showAction');
    const retry = jest.fn();
    host.state.set({ state: 'error', message: 'Konnte nicht geladen werden.', retry });
    view.detectChanges();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Konnte nicht geladen werden.',
        action: 'Erneut versuchen',
      }),
    );
    toast.mock.calls[0][0].closed('action');
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it.each([360, 700, 1200])('has no axe violations at %ipx', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
