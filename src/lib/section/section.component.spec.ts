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
});
