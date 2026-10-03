import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SegmentedComponent, type SegmentedOption } from './segmented.component';

const KINDS: SegmentedOption[] = [
  { value: 'expense', label: 'Ausgabe' },
  { value: 'income', label: 'Einnahme' },
];

const RULES: SegmentedOption[] = [
  { value: 'simple', label: 'Einfach' },
  { value: 'absolute', label: 'Absolut', disabled: true },
  { value: 'two_thirds', label: 'Zwei Drittel' },
];

@Component({
  standalone: true,
  imports: [SegmentedComponent],
  template: `<app-segmented ariaLabel="Art" [options]="options" [(value)]="value" />`,
})
class Host {
  options: SegmentedOption[] = KINDS;
  value = signal<string | null>('expense');
}

describe('SegmentedComponent', () => {
  it('is a named radio group with one checked option', async () => {
    await render(Host);
    expect(screen.getByRole('radiogroup', { name: 'Art' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('has one tab stop: the checked option', async () => {
    await render(Host);
    const [a, b] = screen.getAllByRole('radio');
    expect(a).toHaveAttribute('tabindex', '0');
    expect(b).toHaveAttribute('tabindex', '-1');
  });

  it('selects an option on click and updates the binding', async () => {
    const { fixture } = await render(Host);
    await userEvent.click(screen.getByRole('radio', { name: 'Einnahme' }));
    expect(fixture.componentInstance.value()).toBe('income');
    expect(screen.getByRole('radio', { name: 'Einnahme' })).toHaveAttribute('aria-checked', 'true');
  });

  it('moves the selection and the focus with the arrow keys, wrapping at the ends', async () => {
    const { fixture } = await render(Host);
    const [a, b] = screen.getAllByRole('radio');
    a.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.value()).toBe('income');
    expect(b).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.value()).toBe('expense');
    expect(a).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(fixture.componentInstance.value()).toBe('income');
    await userEvent.keyboard('{ArrowUp}');
    expect(fixture.componentInstance.value()).toBe('expense');
    await userEvent.keyboard('{ArrowDown}');
    expect(fixture.componentInstance.value()).toBe('income');
  });

  it('jumps with Home and End and skips disabled options', async () => {
    const { fixture } = await render(Host, { componentProperties: { options: RULES } });
    fixture.componentInstance.value.set('simple');
    fixture.detectChanges();
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toBeDisabled();
    radios[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.value()).toBe('two_thirds');
    await userEvent.keyboard('{Home}');
    expect(fixture.componentInstance.value()).toBe('simple');
    await userEvent.keyboard('{End}');
    expect(fixture.componentInstance.value()).toBe('two_thirds');
  });

  it('ignores other keys', async () => {
    const { fixture } = await render(Host);
    screen.getAllByRole('radio')[0].focus();
    await userEvent.keyboard('a');
    expect(fixture.componentInstance.value()).toBe('expense');
  });

  it('gives the tab stop to the first enabled option when nothing is selected', async () => {
    const { fixture } = await render(Host, { componentProperties: { options: RULES } });
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios.every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('does nothing when every option is disabled', async () => {
    const all = KINDS.map((o) => ({ ...o, disabled: true }));
    const { fixture } = await render(Host, { componentProperties: { options: all } });
    const seg = fixture.debugElement.children[0].componentInstance as SegmentedComponent;
    const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    seg.onKeydown(ev, 0);
    expect(fixture.componentInstance.value()).toBe('expense');
  });

  it('works as a form control and follows its disabled state', async () => {
    @Component({
      standalone: true,
      imports: [SegmentedComponent, ReactiveFormsModule],
      template: `<app-segmented ariaLabel="Anwesenheit" [options]="opts" [formControl]="ctrl" />`,
    })
    class FormHost {
      opts: SegmentedOption[] = [
        { value: 'present', label: 'Anwesend' },
        { value: 'absent', label: 'Abwesend' },
      ];
      ctrl = new FormControl<string | null>(null);
    }
    const { fixture } = await render(FormHost);
    await userEvent.click(screen.getByRole('radio', { name: 'Abwesend' }));
    expect(fixture.componentInstance.ctrl.value).toBe('absent');
    screen.getByRole('radio', { name: 'Abwesend' }).blur();
    expect(fixture.componentInstance.ctrl.touched).toBe(true);
    fixture.componentInstance.ctrl.setValue('present');
    fixture.detectChanges();
    expect(screen.getByRole('radio', { name: 'Anwesend' })).toHaveAttribute('aria-checked', 'true');
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    expect(screen.getByRole('radio', { name: 'Abwesend' })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Abwesend' }));
    expect(fixture.componentInstance.ctrl.value).toBe('present');
    fixture.componentInstance.ctrl.setValue(null);
    fixture.detectChanges();
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
  });
});
