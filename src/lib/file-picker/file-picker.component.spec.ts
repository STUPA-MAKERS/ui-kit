import { render } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FilePickerComponent } from './file-picker.component';

async function setup(template: string, picked = jest.fn()) {
  const view = await render(template, { imports: [FilePickerComponent], componentProperties: { picked } });
  const field = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  const cmp = view.fixture.debugElement.children[0].componentInstance as FilePickerComponent;
  return { ...view, field, cmp, picked };
}

describe('FilePickerComponent', () => {
  it('renders a hidden input with the filter, out of the tab order', async () => {
    const { field } = await setup(`<app-file-picker accept=".age" (picked)="picked($event)" />`);
    expect(field).toHaveAttribute('accept', '.age');
    expect(field).toHaveAttribute('tabindex', '-1');
    expect(field).toHaveAttribute('aria-hidden', 'true');
    expect(field.multiple).toBe(false);
  });

  it('opens the dialog of the input, and not while disabled', async () => {
    const { field, cmp, fixture } = await setup(
      `<app-file-picker [disabled]="off" (picked)="picked($event)" />`,
    );
    const click = jest.spyOn(field, 'click');
    cmp.open();
    expect(click).toHaveBeenCalledTimes(1);
    fixture.componentInstance['off'] = true;
    fixture.detectChanges();
    cmp.open();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('emits the chosen files and forgets the value, so the same file can come again', async () => {
    const { field, picked } = await setup(`<app-file-picker [multiple]="true" (picked)="picked($event)" />`);
    const a = new File(['a'], 'a.png', { type: 'image/png' });
    const b = new File(['b'], 'b.png', { type: 'image/png' });
    await userEvent.upload(field, [a, b]);
    expect(picked).toHaveBeenCalledWith([a, b]);
    expect(field.value).toBe('');
    await userEvent.upload(field, a);
    expect(picked).toHaveBeenLastCalledWith([a]);
  });

  it('emits nothing for a cancelled dialog', async () => {
    const { field, picked } = await setup(`<app-file-picker (picked)="picked($event)" />`);
    field.dispatchEvent(new Event('change'));
    expect(picked).not.toHaveBeenCalled();
  });
});
