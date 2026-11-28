import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { SheetBodyDirective } from '../side-sheet/side-sheet.component';
import { LayerSheetComponent } from './layer-sheet.component';

@Component({
  standalone: true,
  imports: [LayerSheetComponent, SheetBodyDirective],
  template: `
    @if (open()) {
      <app-layer-sheet heading="Filter" [(open)]="open">
        <ng-template sheetBody><p>Inhalt</p></ng-template>
      </app-layer-sheet>
    }
  `,
})
class HostComponent {
  readonly open = signal(true);
}

describe('LayerSheetComponent', () => {
  it('puts the bottom sheet with its body into a popover box', async () => {
    const shown = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: shown,
    });
    const { container, fixture } = await render(HostComponent);
    await fixture.whenStable();
    const layer = container.querySelector('[popover="manual"]');
    expect(layer).not.toBeNull();
    expect(layer!.querySelector('app-side-sheet')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Filter' })).toBeTruthy();
    expect(screen.getByText('Inhalt')).toBeTruthy();
    expect(shown).toHaveBeenCalled();
    expect(await runAxe(container)).toHaveNoViolations();
    delete (HTMLElement.prototype as { showPopover?: unknown }).showPopover;
  });
});
