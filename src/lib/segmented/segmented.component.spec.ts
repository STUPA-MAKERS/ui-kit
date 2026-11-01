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

  it('stays compact by default', async () => {
    const { container } = await render(Host);
    expect(container.querySelector('app-segmented')).not.toHaveClass('seg-host--control');
  });

  it('fades the selection instead of sliding an indicator', async () => {
    const { container } = await render(
      `<app-segmented ariaLabel="Regel" width="fill" [options]="opts" value="two_thirds" />`,
      { imports: [SegmentedComponent], componentProperties: { opts: RULES } },
    );
    expect(container.querySelector('.seg__ind')).toBeNull();
    const radios = container.querySelectorAll('[role="radio"]');
    expect(radios[2]).toHaveClass('seg__opt--on');
  });

  it('takes the button height with size="control"', async () => {
    const { container } = await render(
      `<app-segmented ariaLabel="Ansicht" size="control" [options]="opts" value="a" />`,
      { imports: [SegmentedComponent], componentProperties: { opts: KINDS } },
    );
    expect(container.querySelector('app-segmented')).toHaveClass('seg-host--control');
  });

  it('keeps one width with size="control": the host marks the check, each label carries its bold copy', async () => {
    const { container } = await render(
      `<app-segmented ariaLabel="Ansicht" size="control" [options]="opts" value="expense" />`,
      { imports: [SegmentedComponent], componentProperties: { opts: KINDS } },
    );
    expect(container.querySelector('app-segmented')).toHaveClass('seg-host--check');
    const labels = [...container.querySelectorAll('.seg__label')].map((l) =>
      l.getAttribute('data-label'),
    );
    expect(labels).toEqual(['Ausgabe', 'Einnahme']);
    expect(screen.getByRole('radio', { name: 'Einnahme' })).toBeInTheDocument();
  });

  it('does not mark the check when check is false', async () => {
    const { container } = await render(
      `<app-segmented ariaLabel="Ansicht" size="control" [check]="false" [options]="opts" value="expense" />`,
      { imports: [SegmentedComponent], componentProperties: { opts: KINDS } },
    );
    expect(container.querySelector('app-segmented')).not.toHaveClass('seg-host--check');
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
    expect(
      screen.getAllByRole('radio').every((r) => r.getAttribute('aria-checked') === 'false'),
    ).toBe(true);
  });

  it('shows a count after the label and reads it as part of the name', async () => {
    const counted: SegmentedOption[] = [
      { value: 'all', label: 'Alle', count: 49 },
      { value: 'paid', label: 'Bezahlt', count: 0 },
      { value: 'none', label: 'Ohne', count: null },
    ];
    await render(Host, { componentProperties: { options: counted } });
    expect(screen.getByRole('radio', { name: 'Alle 49' })).toBeInTheDocument();
    // 0 is a count; null shows none.
    expect(screen.getByRole('radio', { name: 'Bezahlt 0' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Ohne' }).querySelector('.seg__count')).toBeNull();
  });

  it('leaves out the check mark of the chosen segment when asked to', async () => {
    @Component({
      standalone: true,
      imports: [SegmentedComponent],
      template: `<app-segmented
        ariaLabel="Art"
        [options]="opts"
        value="expense"
        [check]="check"
      />`,
    })
    class CheckHost {
      opts = KINDS;
      check = false;
    }
    const { container, fixture } = await render(CheckHost);
    expect(container.querySelector('.seg__check')).toBeNull();
    fixture.componentInstance.check = true;
    fixture.detectChanges();
    expect(container.querySelector('.seg__check')).not.toBeNull();
  });

  it.each([
    ['auto', [] as string[]],
    ['equal', ['seg-host--equal']],
    ['fill', ['seg-host--fill']],
  ] as const)('sets the width class of %s', async (width, classes) => {
    @Component({
      standalone: true,
      imports: [SegmentedComponent],
      template: `<app-segmented ariaLabel="Art" [options]="opts" [width]="width" />`,
    })
    class WidthHost {
      opts = KINDS;
      width = width;
    }
    const { container } = await render(WidthHost);
    const host = container.querySelector('app-segmented') as HTMLElement;
    for (const c of ['seg-host--equal', 'seg-host--fill']) {
      expect(host.classList.contains(c)).toBe((classes as readonly string[]).includes(c));
    }
  });

  it('gives an option a tooltip, and the name stays the label', async () => {
    const titled: SegmentedOption[] = [
      { value: 'simple', label: 'Einfach' },
      { value: 'absolute', label: 'Absolut', disabled: true, title: 'Nur bei geheimer Wahl' },
    ];
    await render(Host, { componentProperties: { options: titled, value: signal('simple') } });
    const off = screen.getByRole('radio', { name: 'Absolut' });
    expect(off).toHaveAttribute('title', 'Nur bei geheimer Wahl');
    expect(off).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Einfach' })).not.toHaveAttribute('title');
  });
});
