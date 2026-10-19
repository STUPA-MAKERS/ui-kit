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
  FileViewerComponent,
  IconComponent,
  InputComponent,
  SegmentedComponent,
  SelectFieldComponent,
  StepperComponent,
  SwitchComponent,
  TableComponent,
  TabsComponent,
} from '../public-api';
import {
  AvatarComponent,
  AvatarStackComponent,
  ConfirmDialogComponent,
  DateBlockComponent,
  DropOverlayComponent,
  EmptyStateComponent,
  FieldGroupComponent,
  FieldRowComponent,
  FileDropZoneComponent,
  FilterSelectComponent,
  ListDetailLayoutComponent,
  ListItemComponent,
  NoteComponent,
  RangeChipComponent,
  RowMenuComponent,
  SearchPillComponent,
  SegBarComponent,
  SelectionBarComponent,
  SheetBarComponent,
  SideSheetComponent,
  SkeletonComponent,
  StatusTextComponent,
  StickyBarComponent,
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
    SelectFieldComponent,
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

@Component({
  standalone: true,
  imports: [
    AvatarComponent,
    AvatarStackComponent,
    ConfirmDialogComponent,
    DateBlockComponent,
    DropOverlayComponent,
    EmptyStateComponent,
    FieldGroupComponent,
    FieldRowComponent,
    FileDropZoneComponent,
    FilterSelectComponent,
    ListDetailLayoutComponent,
    ListItemComponent,
    NoteComponent,
    RangeChipComponent,
    RowMenuComponent,
    SearchPillComponent,
    SegBarComponent,
    SelectionBarComponent,
    SheetBarComponent,
    SkeletonComponent,
    StatusTextComponent,
    StickyBarComponent,
  ],
  template: `
    <main>
      <h1>Muster</h1>
      <app-list-detail [detailOpen]="true">
        <div list class="ld-pane">
          <app-sticky-bar class="ld-pane__filters">
            <app-search-pill placeholder="Anträge durchsuchen" [clearable]="true" value="Rad" />
            <app-filter-select label="Status" [options]="states" />
            <app-range-chip label="Betrag" from="100" />
          </app-sticky-bar>
          <ul class="rowgroup">
            <li>
              <app-list-item title="Lastenrad" sub="Förderantrag" [selected]="true">
                <app-date-block lead [date]="'2026-09-29'" />
                <app-status-text status kind="warn">In Prüfung</app-status-text>
                <app-row-menu trail [sections]="menu" />
              </app-list-item>
            </li>
          </ul>
          <app-selection-bar [count]="2" [allSelected]="false" />
        </div>
        <section detail aria-label="Detail">
          <app-sheet-bar kicker="Studierendenparlament" />
          <app-field-group>
            <app-field-row label="Betrag" value="1.250,00 €" [mono]="true" />
          </app-field-group>
          <app-seg-bar label="1.250 € von 4.000 € ausgegeben" [total]="4000" [segments]="segs" />
          <app-note kind="error" [retryable]="true">Laden fehlgeschlagen.</app-note>
          <app-avatar name="Mara Keller" />
          <app-avatar-stack [names]="['Mara Keller', 'Jonas Weber']" />
          <app-skeleton label="Wird geladen" />
          <app-empty-state heading="Keine Anträge" body="Noch nichts eingereicht." />
          <app-file-drop-zone label="Dateien hierher ziehen" buttonLabel="Auswählen" />
          <div style="position: relative">
            <app-drop-overlay label="Datei ablegen" />
          </div>
        </section>
      </app-list-detail>
      <app-confirm-dialog [open]="true" title="Antrag löschen?" body="Das lässt sich nicht rückgängig machen." />
    </main>
  `,
})
class PatternsHost {
  readonly states = [
    { value: 'open', label: 'Offen' },
    { value: 'done', label: 'Erledigt' },
  ];
  readonly menu = [{ items: [{ id: 'edit', label: 'Bearbeiten' }] }];
  readonly segs = [{ value: 1250, tone: 'filled' as const }];
}

@Component({
  standalone: true,
  imports: [SideSheetComponent],
  template: `
    <main>
      <h1>Blatt</h1>
      <app-side-sheet heading="Anwesenheit" [open]="true"><p>Inhalt</p></app-side-sheet>
    </main>
  `,
})
class SheetHost {}

@Component({
  standalone: true,
  imports: [FileViewerComponent],
  template: `
    <main>
      <h1>Anhänge</h1>
      <app-file-viewer [items]="files" [index]="index" [open]="true">
        <a viewerActions href="/api/attachments/1/download">Herunterladen</a>
        <a viewerFallback href="/api/attachments/3/download">Datei herunterladen</a>
      </app-file-viewer>
    </main>
  `,
})
class FileViewerHost {
  index = 0;
  readonly files = [
    { name: 'logo.png', url: '/api/attachments/1/download' },
    { name: 'Haushaltsplan.pdf', url: '/api/attachments/2/download' },
    { name: 'tabelle.xlsx', url: '/api/attachments/3/download' },
  ];
}

describe('UI-Primitive a11y (axe)', () => {
  it('has no axe violations across the patterns of the app pages', async () => {
    const { container } = await render(PatternsHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('has no axe violations in the side sheet', async () => {
    const { container } = await render(SheetHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('has no axe violations across the building blocks', async () => {
    const { container } = await render(BuildingBlocksHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('has no axe violations across the primitive kit', async () => {
    const { container } = await render(PrimitivesHost);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it.each([0, 1, 2])('file viewer has no axe violations (image, pdf, other: %i)', async (index) => {
    const { container, fixture } = await render(FileViewerHost);
    fixture.componentInstance.index = index;
    fixture.detectChanges();
    expect(await runAxe(container)).toHaveNoViolations();
    document.body.style.overflow = '';
  });

  it('toast live-region has no axe violations', async () => {
    const { container } = await render(ToastComponent);
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
