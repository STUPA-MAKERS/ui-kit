import { render, screen } from '@testing-library/angular';
import { ButtonLinkComponent } from './button-link.component';

describe('ButtonLinkComponent', () => {
  it('stays a link and draws the fill look by default', async () => {
    await render(`<a appButton href="/start">Zur Startseite</a>`, {
      imports: [ButtonLinkComponent],
    });
    const link = screen.getByRole('link', { name: 'Zur Startseite' });
    expect(link).toHaveAttribute('href', '/start');
    expect(link).toHaveClass('btn-link');
    const pill = link.querySelector('.btn') as HTMLElement;
    expect(pill).toHaveClass('btn--fill', 'btn--md');
    expect(pill.querySelector('.btn__label')).toHaveTextContent('Zur Startseite');
  });

  it('takes the look from the attribute, an alias, the size and the block width', async () => {
    await render(
      `<a appButton="outlined" size="sm" href="/a">A</a>
       <a appButton="ghost" [block]="true" href="/b">B</a>`,
      { imports: [ButtonLinkComponent] },
    );
    const a = screen.getByRole('link', { name: 'A' });
    expect(a.querySelector('.btn')).toHaveClass('btn--outlined', 'btn--sm');
    const b = screen.getByRole('link', { name: 'B' });
    expect(b.querySelector('.btn')).toHaveClass('btn--text', 'btn--ghost');
    expect(b).toHaveClass('btn-block');
  });

  it('keeps the download attribute of a file link', async () => {
    await render(`<a appButton="tonal" href="/x.pdf" download>PDF</a>`, {
      imports: [ButtonLinkComponent],
    });
    expect(screen.getByRole('link', { name: 'PDF' })).toHaveAttribute('download');
  });
});
