import { Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SwitchComponent } from './switch.component';

describe('SwitchComponent', () => {
  it('is a switch named by its projected label, off by default', async () => {
    await render(`<app-switch>E-Mail bei neuen Anträgen</app-switch>`, {
      imports: [SwitchComponent],
    });
    const sw = screen.getByRole('switch', { name: 'E-Mail bei neuen Anträgen' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw.tagName).toBe('BUTTON');
    expect(sw).toHaveAttribute('type', 'button');
  });

  it('toggles on click and through the two-way binding', async () => {
    @Component({
      standalone: true,
      imports: [SwitchComponent],
      template: `<app-switch [(checked)]="on">Dunkles Design</app-switch>`,
    })
    class Host {
      on = signal(false);
    }
    const { fixture } = await render(Host);
    const sw = screen.getByRole('switch');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(fixture.componentInstance.on()).toBe(true);
    await userEvent.click(sw);
    expect(fixture.componentInstance.on()).toBe(false);
  });

  it('toggles with the Space key', async () => {
    await render(`<app-switch>Benachrichtigen</app-switch>`, { imports: [SwitchComponent] });
    const sw = screen.getByRole('switch');
    sw.focus();
    await userEvent.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles when the label is clicked', async () => {
    await render(`<app-switch>Pool</app-switch>`, { imports: [SwitchComponent] });
    await userEvent.click(screen.getByText('Pool'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('takes an aria-label when it has no visible label', async () => {
    await render(`<app-switch ariaLabel="Stimmrecht" />`, { imports: [SwitchComponent] });
    expect(screen.getByRole('switch', { name: 'Stimmrecht' })).toBeInTheDocument();
  });

  it('does not toggle while disabled', async () => {
    await render(`<app-switch [disabled]="true">Aus</app-switch>`, { imports: [SwitchComponent] });
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('ignores a direct toggle while disabled and a blur without a form', async () => {
    const { fixture } = await render(`<app-switch [disabled]="true">Aus</app-switch>`, {
      imports: [SwitchComponent],
    });
    const sw = fixture.debugElement.children[0].componentInstance as SwitchComponent;
    sw.toggle();
    expect(sw.checked()).toBe(false);
    expect(() => sw.onTouched()).not.toThrow();
  });

  it('describes itself with the hint', async () => {
    await render(`<app-switch hint="Gilt ab sofort">Aktiv</app-switch>`, {
      imports: [SwitchComponent],
    });
    const sw = screen.getByRole('switch');
    const hint = screen.getByText('Gilt ab sofort');
    expect(sw.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('works as a form control (reactive forms)', async () => {
    @Component({
      standalone: true,
      imports: [SwitchComponent, ReactiveFormsModule],
      template: `<app-switch [formControl]="ctrl">Mail</app-switch>`,
    })
    class Host {
      ctrl = new FormControl(true);
    }
    const { fixture } = await render(Host);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(sw);
    expect(fixture.componentInstance.ctrl.value).toBe(false);
    expect(fixture.componentInstance.ctrl.touched).toBe(false);
    sw.blur();
    expect(fixture.componentInstance.ctrl.touched).toBe(true);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    expect(sw).toBeDisabled();
    fixture.componentInstance.ctrl.setValue(null);
    fixture.detectChanges();
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('works with ngModel', async () => {
    @Component({
      standalone: true,
      imports: [SwitchComponent, FormsModule],
      template: `<app-switch [(ngModel)]="value">Mail</app-switch>`,
    })
    class Host {
      value = false;
    }
    const { fixture } = await render(Host);
    await userEvent.click(screen.getByRole('switch'));
    expect(fixture.componentInstance.value).toBe(true);
  });
});
