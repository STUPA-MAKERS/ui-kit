import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { MetaLineComponent } from './meta-line.component';

const STYLE = readFileSync(join(__dirname, 'meta-line.component.scss'), 'utf8');

describe('MetaLineComponent', () => {
  it('holds the parts of the page in one line, without dots in the markup (001961)', async () => {
    const { container } = await render(
      `<app-meta-line><span>Offen</span>@if (gremium) {<span>{{ gremium }}</span>}<time>19.10.</time></app-meta-line>`,
      { imports: [MetaLineComponent], componentProperties: { gremium: null } },
    );
    const parts = container.querySelectorAll('.ml__parts > *');
    expect(Array.from(parts, (p) => p.textContent)).toEqual(['Offen', '19.10.']);
    expect(container.textContent).not.toContain('·');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('draws a decorative dot outside the box of each part after the first', () => {
    expect(STYLE).toMatch(/\.ml__parts > \* \+ \* \{\s*position: relative;\s*margin-inline-start: \$-sep;/);
    expect(STYLE).toMatch(/\.ml__parts > \* \+ \*::before \{\s*position: absolute;\s*inset-inline-end: 100%;/);
    // The dot has no text for a screen reader.
    expect(STYLE).toContain("content: '·' / '';");
  });
});
