import { render, screen } from '@testing-library/angular';
import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
  it('names the projected textarea with its label', async () => {
    await render(`<app-textarea label="Notiz"><textarea name="note"></textarea></app-textarea>`, {
      imports: [TextareaComponent],
    });
    const area = screen.getByRole('textbox', { name: 'Notiz' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.closest('label')).toHaveClass('ta');
  });

  it('draws the error edge and the growing variant', async () => {
    const { container } = await render(
      `<app-textarea label="Text" [invalid]="true" [grow]="true"><textarea></textarea></app-textarea>`,
      { imports: [TextareaComponent] },
    );
    const box = container.querySelector('.ta');
    expect(box).toHaveClass('ta--invalid');
    expect(box).toHaveClass('ta--grow');
  });
});
