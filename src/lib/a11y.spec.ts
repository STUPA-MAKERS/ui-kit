/**
 * a11y-Scan der UI-Primitive (T-43, requirements N3 — WCAG 2.1 AA).
 *
 * Die Primitive (Button/Input/Select/Checkbox/Dialog/Table/Stepper/Badge/Toast/
 * Vote-Bars) werden quer durch alle Views wiederverwendet — ein axe-Verstoß hier
 * schlägt also überall durch. Jede Komponente wird mit repräsentativen Inputs
 * (inkl. Fehlerzustand) gerendert und mit axe gescannt.
 */
import { Component } from '@angular/core';
import { render } from '@testing-library/angular';
import { runAxe } from '../../testing/a11y';
import {
  AutocompleteComponent,
  BadgeComponent,
  ButtonLinkComponent,
  ChipComponent,
  ChipGroupComponent,
  CopyButtonComponent,
  FilePickerComponent,
  HighlightComponent,
  LockedFieldComponent,
  MoveButtonsComponent,
  TextareaComponent,
  ButtonComponent,
  CardComponent,
  CheckboxComponent,
  DatepickerComponent,
  DateRangeComponent,
  DialogComponent,
  IconComponent,
  InputComponent,
  SegmentedComponent,
  SelectComponent,
  StepperComponent,
  SwitchComponent,
  TableComponent,
  TabsComponent,
} from '../public-api';
import { ToastComponent } from './toast/toast.component';

interface Row {
  name: string;
  amount: number;
}

@Component({
  standalone: true,
  imports: [
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    DatepickerComponent,
    DateRangeComponent,
    BadgeComponent,
    CardComponent,
    StepperComponent,
    IconComponent,
    TableComponent,
    DialogComponent,
    SwitchComponent,
    SegmentedComponent,
    TabsComponent,
  ],
  template: `
    <main>
      <h1>UI-Kit</h1>
      <app-button variant="primary">Speichern</app-button>
      <app-button iconOnly ariaLabel="Schließen"><app-icon name="moon" /></app-button>

      <app-input label="Titel" hint="Pflichtfeld" [required]="true" />
      <app-input label="E-Mail" error="Ungültige Adresse" />

      <app-select
        label="Gremium"
        [options]="[{ value: 'a', label: 'AStA' }]"
        error="Bitte wählen"
      />

      <app-checkbox hint="Optional">Einverstanden</app-checkbox>
      <app-checkbox indeterminate>Alle auswählen</app-checkbox>

      <app-datepicker label="Frist" [required]="true" />
      <app-date-range legend="Zeitraum" startLabel="Von" endLabel="Bis" />

      <app-badge variant="success">Aktiv</app-badge>
      <app-badge>NÖ</app-badge>

      <app-switch hint="Gilt sofort">E-Mail bei neuen Anträgen</app-switch>
      <app-switch ariaLabel="Stimmrecht" [checked]="true" />
      <app-segmented ariaLabel="Art" [options]="kinds" value="expense" />
      <app-tabs #t ariaLabel="Antrag" [tabs]="tabs" active="app" />
      <section role="tabpanel" [id]="t.panelId('app')" [attr.aria-labelledby]="t.tabId('app')">Antrag</section>
      <app-button variant="danger">Löschen</app-button>
      <app-button variant="text" [iconOnly]="true" ariaLabel="Bearbeiten"><app-icon name="edit" /></app-button>

      <h2>Karten</h2>
      <app-card heading="Karte"><p>Inhalt</p></app-card>

      <app-stepper [steps]="steps" [activeIndex]="1" ariaLabel="Fortschritt" />

      <app-table [columns]="cols" [rows]="rows" caption="Anträge" />

      <app-dialog [open]="true" title="Bestätigen" closeLabel="Schließen">
        <p>Wirklich fortfahren?</p>
        <app-button dialog-footer>OK</app-button>
      </app-dialog>
    </main>
  `,
})
class PrimitivesHost {
  readonly steps = [{ label: 'Eins' }, { label: 'Zwei' }, { label: 'Drei' }];
  readonly cols = [
    { key: 'name' as const, label: 'Name' },
    { key: 'amount' as const, label: 'Betrag' },
  ];
  readonly rows: Row[] = [{ name: 'Antrag A', amount: 100 }];
  readonly kinds = [
    { value: 'expense', label: 'Ausgabe' },
    { value: 'income', label: 'Einnahme' },
  ];
  readonly tabs = [
    { id: 'app', label: 'Antrag' },
    { id: 'history', label: 'Verlauf', count: 4 },
  ];
}

@Component({
  standalone: true,
  imports: [
    AutocompleteComponent,
    ButtonComponent,
    ButtonLinkComponent,
    ChipComponent,
    ChipGroupComponent,
    CopyButtonComponent,
    FilePickerComponent,
    HighlightComponent,
    InputComponent,
    LockedFieldComponent,
    MoveButtonsComponent,
    TextareaComponent,
  ],
  template: `
    <main>
      <h1>Bausteine</h1>
      <app-input label="Dauer" suffix="Minuten" />
      <a appButton="outlined" href="/status">Status ansehen</a>
      <app-copy-button text="https://example.org/ics" label="Kopieren" />
      <app-chip [removable]="true" removeLabel="Entfernen: Haushalt">Haushalt</app-chip>
      <app-chip-group ariaLabel="Zahlungsart" [options]="pay" value="cash" />
      <ul>
        <li>Spalte 1 <app-move-buttons [upDisabled]="true" /></li>
      </ul>
      <app-file-picker #picker accept=".pdf" />
      <app-button (click)="picker.open()">Datei wählen</app-button>
      <p><app-highlight text="Lastenrad im Radhaus" query="rad" /></p>
      <app-locked-field label="Haushaltsjahr">2026</app-locked-field>
      <app-autocomplete
        inputId="a11y-ac"
        label="Antrag"
        [options]="hits"
        [open]="true"
        query="La"
      />
      <app-textarea label="Notiz" [invalid]="true"><textarea aria-invalid="true"></textarea></app-textarea>
    </main>
  `,
})
class BuildingBlocksHost {
  readonly pay = [
    { value: 'cash', label: 'Bar' },
    { value: 'card', label: 'Karte' },
  ];
  readonly hits = ['Lastenrad', 'Laptop'];
}

describe('UI-Primitive a11y (axe)', () => {
  it('has no axe violations across the building blocks', async () => {
    const { container } = await render(BuildingBlocksHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('has no axe violations across the primitive kit', async () => {
    const { container } = await render(PrimitivesHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('toast live-region has no axe violations', async () => {
    const { container } = await render(ToastComponent);
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
