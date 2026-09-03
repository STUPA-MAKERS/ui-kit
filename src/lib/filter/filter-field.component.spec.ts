import { render, screen } from '@testing-library/angular';
import { ButtonComponent } from '../button/button.component';
import { FilterFieldComponent } from './filter-field.component';

describe('FilterFieldComponent', () => {
  it('names a single control through the wrapping label', async () => {
    // The default: one control, and the label is what a screen reader reads for it.
    await render(
      `<app-filter-field label="Betrag"><input type="text" /></app-filter-field>`,
      { imports: [FilterFieldComponent] },
    );
    expect(screen.getByRole('textbox', { name: 'Betrag' })).toBeInTheDocument();
  });

  it('leaves each member of a group its own name', async () => {
    // A `<label>` binds to the FIRST control inside it, so the first button of a
    // segmented filter answered to the field's name instead of its own — measured as a
    // group reading "Art Ausgabe Einnahme" with "Alle" missing entirely.
    await render(
      `<app-filter-field label="Art" [group]="true">
         <app-button>Alle</app-button>
         <app-button>Ausgabe</app-button>
       </app-filter-field>`,
      { imports: [FilterFieldComponent, ButtonComponent] },
    );
    expect(screen.getByRole('button', { name: 'Alle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ausgabe' })).toBeInTheDocument();
  });

  it('names the group itself, so the set is not anonymous', async () => {
    await render(
      `<app-filter-field label="Art" [group]="true"><app-button>Alle</app-button></app-filter-field>`,
      { imports: [FilterFieldComponent, ButtonComponent] },
    );
    expect(screen.getByRole('group', { name: 'Art' })).toBeInTheDocument();
  });

  it('wraps a single control in a label, not a group', async () => {
    const { container } = await render(
      `<app-filter-field label="Betrag"><input type="text" /></app-filter-field>`,
      { imports: [FilterFieldComponent] },
    );
    expect(container.querySelector('label')).toBeTruthy();
    expect(container.querySelector('[role="group"]')).toBeNull();
  });
});
