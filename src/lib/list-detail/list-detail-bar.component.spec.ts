import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SheetBarComponent, SheetBarTitleDirective } from '../sheet-bar/sheet-bar.component';
import { ListDetailBarComponent, ListDetailNavDirective } from './list-detail-bar.component';

/** A panel outside `app-list-detail` (the card drawer of a board) with the bar of the layout. */
@Component({
  standalone: true,
  imports: [ListDetailBarComponent, ListDetailNavDirective, SheetBarComponent, SheetBarTitleDirective],
  template: `
    <aside class="panel" [appListDetailNav]="phone()">
      @if (phone()) {
        <app-list-detail-bar label="Zum Board" (back)="backs = backs + 1" />
      }
      <app-sheet-bar>
        <h2 appSheetBarTitle>Plakate drucken</h2>
        <button type="button">Menü</button>
      </app-sheet-bar>
    </aside>
  `,
})
class DrawerHost {
  readonly phone = signal(true);
  backs = 0;
}

describe('ListDetailBarComponent with appListDetailNav', () => {
  it('takes the actions of the sheet bar, docks it, and emits back', async () => {
    const view = await render(DrawerHost);
    const bar = view.container.querySelector('app-list-detail-bar') as HTMLElement;
    expect(bar).toHaveClass('ld__bar');
    expect(bar.querySelector('.ld__barActions button')?.textContent).toBe('Menü');
    expect(view.container.querySelector('app-sheet-bar')).toHaveClass('sheet-bar--docked');
    await userEvent.click(screen.getByRole('button', { name: 'Zum Board' }));
    expect(view.fixture.componentInstance.backs).toBe(1);
  });

  it('leaves the actions in the sheet bar while it is off', async () => {
    const view = await render(DrawerHost);
    view.fixture.componentInstance.phone.set(false);
    view.fixture.detectChanges();
    expect(view.container.querySelector('app-list-detail-bar')).toBeNull();
    const sheet = view.container.querySelector('app-sheet-bar') as HTMLElement;
    expect(sheet).not.toHaveClass('sheet-bar--docked');
    expect(sheet.querySelector('.sheet-bar__actions button')?.textContent).toBe('Menü');
  });

  it('shows a fixed title compact from the start', async () => {
    const view = await render(
      `<div appListDetailNav><app-list-detail-bar title="Antrag stellen" /></div>`,
      { imports: [ListDetailBarComponent, ListDetailNavDirective] },
    );
    const bar = view.container.querySelector('app-list-detail-bar') as HTMLElement;
    expect(bar).toHaveClass('ld__bar--condensed');
    expect(bar.querySelector('.ld__barTitle')?.textContent).toBe('Antrag stellen');
  });
});
