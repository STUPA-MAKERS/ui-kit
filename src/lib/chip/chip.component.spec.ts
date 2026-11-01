import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ChipComponent } from './chip.component';

describe('ChipComponent', () => {
  it('shows its content and no button without removable', async () => {
    await render(`<app-chip><span>Antrag 12</span></app-chip>`, { imports: [ChipComponent] });
    expect(screen.getByText('Antrag 12')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('drops the thing with a named remove button', async () => {
    const remove = jest.fn();
    await render(
      `<app-chip [removable]="true" removeLabel="Verknüpfung „Antrag 12“ entfernen" (remove)="remove()">Antrag 12</app-chip>`,
      { imports: [ChipComponent], componentProperties: { remove } },
    );
    const x = screen.getByRole('button', { name: 'Verknüpfung „Antrag 12“ entfernen' });
    expect(x.querySelector('[data-icon="x"]')).not.toBeNull();
    await userEvent.click(x);
    expect(remove).toHaveBeenCalledTimes(1);
    x.focus();
    await userEvent.keyboard('{Enter}');
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it('sizes the remove button and its glyph', async () => {
    await render(
      `<app-chip [removable]="true" removeLabel="a" removeSize="sm">A</app-chip>
       <app-chip [removable]="true" removeLabel="b" removeSize="lg">B</app-chip>
       <app-chip [removable]="true" removeLabel="c">C</app-chip>`,
      { imports: [ChipComponent] },
    );
    expect(screen.getByRole('button', { name: 'a' })).toHaveClass('rmchip__x--sm');
    expect(screen.getByRole('button', { name: 'b' })).toHaveClass('rmchip__x--lg');
    const c = screen.getByRole('button', { name: 'c' });
    expect(c).not.toHaveClass('rmchip__x--sm');
    expect(c).not.toHaveClass('rmchip__x--lg');
    const size = (name: string) =>
      (screen.getByRole('button', { name }).querySelector('app-icon') as HTMLElement).style.getPropertyValue(
        '--icon-size',
      );
    expect([size('a'), size('c'), size('b')]).toEqual(['13px', '14px', '16px']);
  });
});
