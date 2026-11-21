import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UnsavedChanges, type FormDef } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { FORM_DEF } from '../../../testing/screens';
import type { FormValue } from '../form/form.component';
import {
  FormScreenComponent,
  ScreenFormTopDirective,
  type FormScreenDiscard,
} from './form-screen.component';

const DEF: FormDef = {
  sections: [
    { key: 's', fields: [{ key: 'title', kind: 'text', label: 'Titel', required: true }] },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormScreenComponent, ScreenFormTopDirective],
  template: `
    <div [style.width.px]="width()">
      <app-form-screen
        [head]="{ title: 'Buchung anlegen' }"
        icon="swap"
        subtitle="Kultur"
        [form]="def()"
        [value]="value()"
        [errors]="errors()"
        [submit]="{ label: 'Buchung anlegen', busy: busy() }"
        [discard]="discard()"
        (valueChange)="value.set($event)"
        (submit)="onSubmit($event)"
        (discard)="onDiscard()"
        (cancel)="onCancel()"
      >
        <ng-template screenFormTop><p>Ein Hinweis</p></ng-template>
      </app-form-screen>
    </div>
  `,
})
class Host {
  readonly def = input<FormDef>(DEF);
  readonly width = input(800);
  readonly discard = input<FormScreenDiscard | null>(null);
  readonly value = signal<FormValue>({});
  readonly errors = signal<Record<string, string>>({});
  readonly busy = signal(false);
  onSubmit = jest.fn();
  onDiscard = jest.fn(() => this.value.set({ title: '' }));
  onCancel = jest.fn();
}

async function setup(
  inputs: Partial<{ def: FormDef; width: number; discard: FormScreenDiscard }> = {},
) {
  const view = await render(Host, { inputs });
  return { view, host: view.fixture.componentInstance };
}

describe('FormScreenComponent', () => {
  it('shows the head bar of 001890: icon, title, subtitle and Abbrechen', async () => {
    await setup();
    expect(screen.getByRole('heading', { level: 1, name: /Buchung anlegen/ })).toBeTruthy();
    expect(screen.getByText('Kultur')).toBeTruthy();
    expect(document.querySelector('[data-icon="swap"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeTruthy();
    expect(screen.getByText('Ein Hinweis')).toBeTruthy();
  });

  it('shows Speichern only while there are changes and submits a valid form', async () => {
    const { host } = await setup();
    expect(screen.queryByRole('button', { name: /Buchung anlegen/ })).toBeNull();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Miete');
    await userEvent.click(await screen.findByRole('button', { name: /Buchung anlegen/ }));
    expect(host.onSubmit).toHaveBeenCalledWith({ title: 'Miete' });
  });

  it('does not submit an invalid form and shows its errors', async () => {
    const { host } = await setup();
    const title = screen.getByLabelText(/Titel/);
    await userEvent.type(title, 'x');
    await userEvent.clear(title);
    await userEvent.click(await screen.findByRole('button', { name: /Buchung anlegen/ }));
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Bitte ausfüllen.')).toBeTruthy();
  });

  it('takes the value as saved when busy ends without server errors', async () => {
    const { host, view } = await setup();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Miete');
    await userEvent.click(await screen.findByRole('button', { name: /Buchung anlegen/ }));
    host.busy.set(true);
    view.fixture.detectChanges();
    host.busy.set(false);
    view.fixture.detectChanges();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Buchung anlegen/ })).toBeNull(),
    );
  });

  it('offers Verwerfen while there are changes', async () => {
    const { host } = await setup({ discard: { label: 'Verwerfen' } });
    expect(screen.queryByRole('button', { name: 'Verwerfen' })).toBeNull();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Miete');
    await userEvent.click(await screen.findByRole('button', { name: 'Verwerfen' }));
    expect(host.onDiscard).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Verwerfen' })).toBeNull());
  });

  it('asks before Abbrechen leaves changes, and stays on "Abbrechen" in the question', async () => {
    const { host } = await setup();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(host.onCancel).toHaveBeenCalledTimes(1);

    await userEvent.type(screen.getByLabelText(/Titel/), 'Miete');
    await userEvent.click(screen.getAllByRole('button', { name: 'Abbrechen' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Änderungen verwerfen?' });
    expect(dialog).toBeTruthy();
    await userEvent.click(screen.getAllByRole('button', { name: 'Abbrechen' }).at(-1)!);
    expect(host.onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getAllByRole('button', { name: 'Abbrechen' })[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Verwerfen' }));
    await waitFor(() => expect(host.onCancel).toHaveBeenCalledTimes(2));
  });

  it('holds a place in UnsavedChanges while there are changes, so the route guard asks', async () => {
    await setup();
    const unsaved = TestBed.inject(UnsavedChanges);
    expect(unsaved.dirty()).toBe(false);
    await userEvent.type(screen.getByLabelText(/Titel/), 'Miete');
    await waitFor(() => expect(unsaved.dirty()).toBe(true));
  });

  it.each([360, 700, 1200])(
    'has no axe violations at %ipx with every field kind',
    async (width) => {
      const { view } = await setup({ def: FORM_DEF, width });
      expect(await runAxe(view.container)).toHaveNoViolations();
    },
  );
});
