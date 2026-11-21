import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { MEDIA, ToastService, type FormDef } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { matchOnly } from '../../../testing/media';
import { FORM_DEF } from '../../../testing/screens';
import type { FormValue } from '../form/form.component';
import {
  ScreenWizardStepDirective,
  WizardScreenComponent,
  type WizardIntro,
  type WizardStep,
} from './wizard-screen.component';

const DEF: FormDef = {
  sections: [
    {
      key: 'main',
      label: 'Antrag',
      fields: [
        { key: 'title', kind: 'text', label: 'Titel', required: true },
        { key: 'ok', kind: 'checkbox', label: 'Mit Bühne' },
      ],
    },
    {
      key: 'contact',
      label: 'Kontakt',
      fields: [{ key: 'name', kind: 'text', label: 'Name', required: true }],
    },
  ],
};

const STEPS: readonly WizardStep[] = [
  { key: 'details', label: 'Angaben', title: 'Angaben zum Antrag', sections: ['main'] },
  { key: 'contact', label: 'Kontakt', title: 'Kontakt', sections: ['contact'] },
];

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [WizardScreenComponent, ScreenWizardStepDirective],
  template: `
    <div [style.width.px]="width()">
      <app-wizard-screen
        [head]="{ title: 'Antrag stellen' }"
        [form]="def()"
        [steps]="steps()"
        [intro]="intro()"
        [review]="{ key: 'review', label: 'Prüfen & absenden', title: 'Prüfen & absenden' }"
        [value]="value()"
        [step]="step()"
        [submit]="{ label: 'Antrag anlegen' }"
        [discard]="
          chosen()
            ? { label: 'Entwurf verwerfen', title: 'Entwurf verwerfen?', body: 'Weg.' }
            : null
        "
        [leave]="{ label: 'Zur Startseite' }"
        (valueChange)="value.set($event)"
        (choice)="chosen.set($event)"
        (submit)="onSubmit($event)"
        (discard)="onDiscard()"
        (leave)="onLeave()"
      >
        <ng-template screenWizardStep="contact"><p>Kontakt der Seite</p></ng-template>
      </app-wizard-screen>
    </div>
  `,
})
class Host {
  readonly def = input<FormDef>(DEF);
  readonly steps = input<readonly WizardStep[]>(STEPS);
  readonly width = input(1200);
  readonly step = input(0);
  readonly chosen = signal<string | null>(null);
  readonly value = signal<FormValue>({});
  readonly intro = computed<WizardIntro>(() => ({
    key: 'type',
    label: 'Antragsart',
    title: 'Antragsart wählen',
    chosen: this.chosen(),
    groups: [
      {
        key: 'money',
        label: 'Mit Budget',
        text: '- **Förderantrag**: Geld\n<script>alert(1)</script>',
        options: [
          { value: 'funding', label: 'Förderantrag' },
          { value: 'purchase', label: 'Anschaffung' },
        ],
      },
      { key: 'other', options: [{ value: 'motion', label: 'Sonstiger Antrag' }] },
    ],
  }));
  onSubmit = jest.fn();
  onDiscard = jest.fn(() => this.chosen.set(null));
  onLeave = jest.fn();
}

async function setup(
  inputs: Partial<{ def: FormDef; steps: readonly WizardStep[]; width: number; step: number }> = {},
) {
  const view = await render(Host, { inputs });
  return { view, host: view.fixture.componentInstance };
}

const next = () => screen.getByRole('button', { name: 'Weiter' });

async function pickAndContinue(): Promise<void> {
  await userEvent.click(screen.getByRole('radio', { name: 'Förderantrag' }));
  await userEvent.click(next());
}

describe('WizardScreenComponent', () => {
  // jsdom has no scrolling; a step change scrolls to the top.
  beforeEach(() => jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined));

  it('shows the choice step first: step line, stepper and Weiter only after a pick', async () => {
    const { host } = await setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Antrag stellen' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Antragsart wählen' })).toBeTruthy();
    expect(screen.getByText('Schritt 1 von 4')).toBeTruthy();
    expect(next().hasAttribute('disabled') || next().getAttribute('aria-disabled')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Entwurf verwerfen' })).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Förderantrag' }));
    expect(host.chosen()).toBe('funding');
    expect(screen.getByRole('radio', { name: 'Förderantrag' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('renders the group text as safe Markdown', async () => {
    await setup();
    const text = document.querySelector('.wz__groupText');
    expect(text?.querySelector('li strong')?.textContent).toBe('Förderantrag');
    expect(text?.querySelector('script')).toBeNull();
  });

  it('opens the named step with the chosen option after the count', async () => {
    await setup();
    await pickAndContinue();
    expect(screen.getByRole('heading', { level: 2, name: 'Angaben zum Antrag' })).toBeTruthy();
    expect(screen.getByText('Schritt 2 von 4 · Förderantrag')).toBeTruthy();
    expect(screen.getByLabelText(/Titel/)).toBeTruthy();
    expect(screen.queryByLabelText(/Name/)).toBeNull();
  });

  it('keeps a step with an error open, shows the errors and a toast', async () => {
    await setup();
    const toast = jest.spyOn(TestBed.inject(ToastService), 'show');
    await pickAndContinue();
    await userEvent.click(next());
    expect(screen.getByText('Schritt 2 von 4 · Förderantrag')).toBeTruthy();
    expect(toast).toHaveBeenCalledWith({
      text: 'Bitte prüfe die markierten Felder.',
      kind: 'error',
    });
    await waitFor(() =>
      expect(screen.getByLabelText(/Titel/).getAttribute('aria-invalid')).toBe('true'),
    );
  });

  it('shows the slot of a step and the summary built from the form, then submits', async () => {
    const { host } = await setup();
    await pickAndContinue();
    await userEvent.type(screen.getByLabelText(/Titel/), 'Sommerfest');
    await userEvent.click(screen.getByLabelText(/Mit Bühne/));
    await userEvent.click(next());
    expect(screen.getByText('Kontakt der Seite')).toBeTruthy();
    await userEvent.type(screen.getByLabelText(/Name/), 'Alex');
    await userEvent.click(next());
    expect(screen.getByRole('heading', { level: 2, name: 'Prüfen & absenden' })).toBeTruthy();
    expect(screen.getByText('Sommerfest')).toBeTruthy();
    expect(screen.getByText('Ja')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Antrag anlegen' }));
    expect(host.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Sommerfest', ok: true, name: 'Alex' }),
    );
  });

  it('opens the first step with an error on submit', async () => {
    const { host } = await setup({ step: 3 });
    host.chosen.set('funding');
    await userEvent.click(await screen.findByRole('button', { name: 'Antrag anlegen' }));
    expect(host.onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('Schritt 2 von 4 · Förderantrag')).toBeTruthy();
  });

  it('goes back with Zurück', async () => {
    await setup();
    await pickAndContinue();
    await userEvent.click(screen.getByRole('button', { name: 'Zurück' }));
    expect(screen.getByText('Schritt 1 von 4')).toBeTruthy();
  });

  it('asks before it discards the draft', async () => {
    const { host } = await setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Förderantrag' }));
    const discard = screen.getAllByRole('button', { name: 'Entwurf verwerfen' })[0];
    await userEvent.click(discard);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      [...dialog.querySelectorAll('button')].find((b) => b.textContent?.includes('verwerfen'))!,
    );
    expect(host.onDiscard).toHaveBeenCalledTimes(1);
  });

  it('shows the back arrow and the title in a bar on a phone', async () => {
    const restore = matchOnly(MEDIA.phone);
    try {
      const { host } = await setup({ width: 360 });
      const bar = document.querySelector('app-list-detail-bar');
      expect(bar?.textContent).toContain('Antrag stellen');
      await userEvent.click(screen.getByRole('button', { name: 'Zur Startseite' }));
      expect(host.onLeave).toHaveBeenCalledTimes(1);
    } finally {
      restore();
    }
  });

  it.each([360, 700, 1200])('has no axe violations at %ipx on the choice step', async (width) => {
    const { view } = await setup({ width });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });

  it.each([360, 700, 1200])(
    'has no axe violations at %ipx on a form step with every field kind',
    async (width) => {
      const { view } = await setup({
        def: FORM_DEF,
        steps: [{ key: 'all', label: 'Angaben', title: 'Angaben', sections: ['main'] }],
        width,
      });
      await pickAndContinue();
      expect(await runAxe(view.container)).toHaveNoViolations();
    },
  );
});
