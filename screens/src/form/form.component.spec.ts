import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { UI_KIT_UPLOAD, type FormDef } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { FORM_DEF } from '../../../testing/screens';
import { FormComponent, type FormCommit, type FormValue } from './form.component';
import { cleanValue, fieldError, validIban, withDefaults } from './form.rules';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormComponent],
  template: `
    <app-form
      [form]="def()"
      [value]="value()"
      [errors]="errors()"
      (valueChange)="onValue($event)"
      (commit)="onCommit($event)"
    />
  `,
})
class Host {
  readonly def = input<FormDef>(FORM_DEF);
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly value = signal<FormValue>({});
  readonly form = viewChild.required(FormComponent);
  readonly values: FormValue[] = [];
  readonly commits: FormCommit[] = [];
  onValue(v: FormValue): void {
    this.values.push(v);
    this.value.set(v);
  }
  onCommit(c: FormCommit): void {
    this.commits.push(c);
  }
}

const SMALL: FormDef = {
  sections: [
    {
      key: 's',
      fields: [
        { key: 'title', kind: 'text', label: 'Titel', required: true },
        { key: 'count', kind: 'number', label: 'Anzahl', min: 1 },
        { key: 'secret', kind: 'text', label: 'Geheim', visible: false },
      ],
    },
  ],
};

async function setup(inputs: Partial<{ def: FormDef; errors: Record<string, string> }> = {}) {
  const view = await render(Host, { inputs: { def: SMALL, ...inputs } });
  const host = view.fixture.componentInstance;
  return { view, host, form: host.form() };
}

describe('form rules', () => {
  it('checks required, length, formats and limits', () => {
    const text = { key: 't', kind: 'text', label: 'T', required: true, maxLength: 3 } as const;
    expect(fieldError(text, '')?.kind).toBe('required');
    expect(fieldError(text, 'abcd')?.kind).toBe('maxLength');
    expect(fieldError(text, 'abc')).toBeNull();
    expect(fieldError({ key: 'm', kind: 'email', label: 'M' }, 'x@')?.kind).toBe('email');
    expect(fieldError({ key: 'u', kind: 'url', label: 'U' }, 'example')?.kind).toBe('url');
    expect(fieldError({ key: 'n', kind: 'number', label: 'N', max: 5 }, '7')?.kind).toBe('max');
    expect(fieldError({ key: 'n', kind: 'number', label: 'N' }, 'x')?.kind).toBe('number');
    expect(
      fieldError({ key: 'c', kind: 'checkbox', label: 'C', required: true }, false)?.kind,
    ).toBe('required');
    expect(
      fieldError({ key: 'p', kind: 'text', label: 'P', pattern: '[A-Z]{2}' }, 'abc')?.kind,
    ).toBe('pattern');
  });

  it('skips a hidden and a disabled field', () => {
    expect(
      fieldError({ key: 't', kind: 'text', label: 'T', required: true, visible: false }, ''),
    ).toBeNull();
    expect(
      fieldError({ key: 't', kind: 'text', label: 'T', required: true, disabled: true }, ''),
    ).toBeNull();
  });

  it('checks an IBAN with mod 97', () => {
    expect(validIban('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(validIban('DE89 3704 0044 0532 0130 01')).toBe(false);
  });

  it('fills empty values and cleans the value for the app', () => {
    const fields = SMALL.sections[0].fields;
    const model = withDefaults(fields, { count: 3 });
    expect(model).toEqual({ title: '', count: '3', secret: '' });
    expect(cleanValue(fields, { ...model, secret: 'x' })).toEqual({ title: '', count: 3 });
  });
});

describe('FormComponent', () => {
  it('renders every field kind of the fixture', async () => {
    await setup({ def: FORM_DEF });
    expect(screen.getByRole('heading', { name: 'Antrag' })).toBeTruthy();
    expect(screen.getByLabelText(/Titel/)).toBeTruthy();
    expect(screen.getByLabelText(/Begründung/)).toBeTruthy();
    expect(screen.getByLabelText(/E-Mail/)).toBeTruthy();
    expect(screen.getByRole('group', { name: /Bereiche/ })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Kultur' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Öffentlich' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: /Ich stimme zu/ })).toBeTruthy();
    expect(screen.getByText('Dateien hierher ziehen oder auswählen')).toBeTruthy();
    expect(screen.getByText('Die Angaben gehen an das Präsidium.')).toBeTruthy();
    // The repeat group starts with its minimum of one row.
    expect(screen.getByLabelText(/Was/)).toBeTruthy();
  });

  it('emits the whole value after a change, without the hidden field', async () => {
    const { host } = await setup();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Fest');
    await waitFor(() => expect(host.values.at(-1)).toEqual({ title: 'Fest', count: null }));
    await userEvent.type(screen.getByLabelText(/Anzahl/), '4');
    await waitFor(() => expect(host.values.at(-1)).toEqual({ title: 'Fest', count: 4 }));
  });

  it('is invalid and clean at the start, and dirty after a change', async () => {
    const { form } = await setup();
    expect(form.valid()).toBe(false);
    expect(form.dirty()).toBe(false);
    await userEvent.type(screen.getByLabelText(/Titel/), 'A');
    await waitFor(() => expect(form.valid()).toBe(true));
    expect(form.dirty()).toBe(true);
    form.markPristine();
    expect(form.dirty()).toBe(false);
  });

  it('shows a required error only after leaving the field', async () => {
    await setup();
    const title = screen.getByLabelText(/Titel/);
    expect(screen.queryByText('Bitte ausfüllen.')).toBeNull();
    await userEvent.click(title);
    await userEvent.tab();
    expect(await screen.findByText('Bitte ausfüllen.')).toBeTruthy();
    expect(title.getAttribute('aria-describedby')).toContain('error');
  });

  it('shows every error on showErrors and focuses the first field with one', async () => {
    const { form, view } = await setup();
    expect(form.showErrors()).toBe(false);
    view.fixture.detectChanges();
    expect(await screen.findByText('Bitte ausfüllen.')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(/Titel/)));
  });

  it('shows a server error until its field changes', async () => {
    await setup({ errors: { title: 'Der Titel ist vergeben.' } });
    expect(screen.getByText('Der Titel ist vergeben.')).toBeTruthy();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Neu');
    await waitFor(() => expect(screen.queryByText('Der Titel ist vergeben.')).toBeNull());
  });

  it('commits a changed field of an autosave section when the person leaves it', async () => {
    const def: FormDef = { sections: [{ ...SMALL.sections[0], autosave: true }] };
    const { host } = await setup({ def });
    const title = screen.getByLabelText(/Titel/);
    await userEvent.click(title);
    await userEvent.tab();
    expect(host.commits).toEqual([]);
    await userEvent.type(title, 'Fest');
    await userEvent.tab();
    expect(host.commits).toEqual([{ key: 'title', value: 'Fest' }]);
  });

  it('adds and removes rows of a repeat group within its limits', async () => {
    const def: FormDef = { sections: [FORM_DEF.sections[1]] };
    const { host } = await setup({ def });
    expect(screen.queryByRole('button', { name: 'Eintrag 1 entfernen' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Posten hinzufügen/ }));
    expect(screen.getAllByLabelText(/Was/)).toHaveLength(2);
    await userEvent.type(screen.getAllByLabelText(/Was/)[1], 'Miete');
    await waitFor(() =>
      expect(host.values.at(-1)).toEqual({
        items: [
          { what: '', cost: null },
          { what: 'Miete', cost: null },
        ],
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Eintrag 1 entfernen' }));
    expect(screen.getAllByLabelText(/Was/)).toHaveLength(1);
    expect((screen.getByLabelText(/Was/) as HTMLInputElement).value).toBe('Miete');
  });

  it('ticks options of a multi-select', async () => {
    const def: FormDef = {
      sections: [
        { key: 's', fields: [FORM_DEF.sections[0].fields.find((f) => f.key === 'tags')!] },
      ],
    };
    const { host } = await setup({ def });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sport' }));
    await waitFor(() => expect(host.values.at(-1)).toEqual({ tags: ['sport'] }));
  });

  it('uploads files through the upload port', async () => {
    const upload = jest.fn(async (f: File) => ({ url: `/f/${f.name}`, name: f.name }));
    const def: FormDef = {
      sections: [
        { key: 's', fields: [{ key: 'files', kind: 'file', label: 'Anlagen', multiple: true }] },
      ],
    };
    const view = await render(Host, {
      inputs: { def },
      providers: [{ provide: UI_KIT_UPLOAD, useValue: upload }],
    });
    const fileInput = view.container.querySelector('input[type=file]') as HTMLInputElement;
    await userEvent.upload(fileInput, new File(['x'], 'plan.pdf', { type: 'application/pdf' }));
    await waitFor(() =>
      expect(view.fixture.componentInstance.values.at(-1)).toEqual({
        files: [{ url: '/f/plan.pdf', name: 'plan.pdf' }],
      }),
    );
    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'plan.pdf entfernen' }));
    await waitFor(() =>
      expect(view.fixture.componentInstance.values.at(-1)).toEqual({ files: [] }),
    );
  });

  it('has no axe violations with every field kind, also with errors shown', async () => {
    const { view, form } = await setup({ def: FORM_DEF });
    expect(await runAxe(view.container)).toHaveNoViolations();
    form.showErrors();
    view.fixture.detectChanges();
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
