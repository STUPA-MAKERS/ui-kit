import { render } from '@testing-library/angular';
import { HighlightComponent } from './highlight.component';

describe('HighlightComponent', () => {
  it('marks every match and keeps the text in one piece', async () => {
    const { container } = await render(HighlightComponent, {
      inputs: { text: 'Lastenrad im Radhaus', query: 'rad' },
    });
    const marks = Array.from(container.querySelectorAll('mark.hl__hit')).map((m) => m.textContent);
    expect(marks).toEqual(['rad', 'Rad']);
    expect(container.textContent).toBe('Lastenrad im Radhaus');
  });

  it('shows the plain text for an empty query', async () => {
    const { container } = await render(HighlightComponent, {
      inputs: { text: 'Beamer', query: '' },
    });
    expect(container.querySelector('mark')).toBeNull();
    expect(container.textContent).toBe('Beamer');
  });
});
