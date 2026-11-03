import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { SectionComponent } from './section.component';

describe('SectionComponent', () => {
  it('names its group with the title and shows the content below', async () => {
    const { container } = await render(
      `<app-section heading="Beleg"><p>Rechnung</p></app-section>`,
      { imports: [SectionComponent] },
    );
    const title = screen.getByRole('heading', { level: 3, name: 'Beleg' });
    expect(screen.getByRole('group', { name: 'Beleg' })).toBeInTheDocument();
    expect(container.querySelector('.section__body')).toHaveTextContent('Rechnung');
    expect(title.closest('.section__head')).toBeTruthy();
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('puts an action at the end of the title row', async () => {
    const { container } = await render(
      `<app-section heading="Unterbuchungen"><button sectionAction type="button">Hinzufügen</button><p>Liste</p></app-section>`,
      { imports: [SectionComponent] },
    );
    expect(screen.getByRole('button', { name: 'Hinzufügen' }).parentElement).toHaveClass('section__head');
    expect(container.querySelector('.section__body')).not.toHaveTextContent('Hinzufügen');
  });

  it('takes the large look on request', async () => {
    const { container } = await render(
      `<app-section heading="Verteilung" size="lg"></app-section><app-section heading="Beleg"></app-section>`,
      { imports: [SectionComponent] },
    );
    const hosts = container.querySelectorAll('app-section');
    expect(hosts[0]).toHaveClass('section--lg');
    expect(hosts[1]).not.toHaveClass('section--lg');
  });

  it('takes another heading level', async () => {
    await render(`<app-section heading="Rollen" [level]="2"></app-section>`, {
      imports: [SectionComponent],
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Rollen' })).toBeInTheDocument();
  });

  it('gives each section its own title id', async () => {
    const { container } = await render(
      `<app-section heading="A"></app-section><app-section heading="B"></app-section>`,
      { imports: [SectionComponent] },
    );
    const ids = [...container.querySelectorAll('.section__title')].map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('shows a tag beside the title', async () => {
    const { container } = await render(`<app-section heading="Beschluss" meta="abweichend"></app-section>`, {
      imports: [SectionComponent],
    });
    expect(container.querySelector('.section__meta')).toHaveTextContent('abweichend');
    expect(screen.getByRole('heading', { name: 'Beschluss' })).toBeInTheDocument();
  });

  it('marks a required section with a star that screen readers skip', async () => {
    await render(`<app-section heading="Anhänge" required></app-section>`, { imports: [SectionComponent] });
    const title = screen.getByRole('heading', { name: 'Anhänge' });
    expect(title.querySelector('.section__req')).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes the title id from the page', async () => {
    await render(`<app-section heading="Daten" headingId="x-data"></app-section>`, {
      imports: [SectionComponent],
    });
    expect(screen.getByRole('heading', { name: 'Daten' }).id).toBe('x-data');
    expect(screen.getByRole('group', { name: 'Daten' })).toHaveAttribute('aria-labelledby', 'x-data');
  });

  it('keeps a hidden title for screen readers', async () => {
    const { container } = await render(`<app-section heading="Details" hideHeading><p>x</p></app-section>`, {
      imports: [SectionComponent],
    });
    expect(container.querySelector('.section__head')).toHaveClass('section__head--hidden');
    expect(screen.getByRole('group', { name: 'Details' })).toBeInTheDocument();
  });
});
