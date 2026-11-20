import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { FactsComponent } from './facts.component';

const STYLE = readFileSync(join(__dirname, 'facts.component.scss'), 'utf8');

describe('FactsComponent', () => {
  it('keeps the list a dl with its facts and sets the layout (001965)', async () => {
    const { container } = await render(
      `<dl appFacts [card]="card" [layout]="layout"><div><dt>Betrag</dt><dd>120,00 €</dd></div></dl>`,
      { imports: [FactsComponent], componentProperties: { card: true, layout: 'grid' } },
    );
    const dl = container.querySelector('dl')!;
    expect(dl.classList).toContain('facts');
    expect(dl.classList).toContain('facts--card');
    expect(dl.classList).not.toContain('facts--rows');
    expect(dl.querySelector('dt')!.textContent).toBe('Betrag');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('puts the label left of the value in rows', async () => {
    const { container } = await render(`<dl appFacts layout="rows"><dt>Wann</dt><dd>14:00</dd></dl>`, {
      imports: [FactsComponent],
    });
    expect(container.querySelector('dl')!.classList).toContain('facts--rows');
    expect(STYLE).toMatch(/\.facts--rows > div \{\s*display: contents;/);
  });
});
