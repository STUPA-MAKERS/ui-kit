import { render, screen } from '@testing-library/angular';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('shows the heading as a section heading when it fills the page or pane', async () => {
    await render(EmptyStateComponent, {
      inputs: { heading: 'Antrag nicht gefunden', fill: true },
    });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Antrag nicht gefunden' }),
    ).toBeInTheDocument();
  });

  it('omits the body when there is nothing useful to add', async () => {
    const { container } = await render(EmptyStateComponent, {
      inputs: { heading: 'Nichts da' },
    });
    expect(container.querySelector('.es__body')).toBeNull();
  });

  it('shows a code above the heading when one is given', async () => {
    await render(EmptyStateComponent, {
      inputs: { heading: 'Seite nicht gefunden', code: '404' },
    });
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  /** § NF/usability/controls/001360: a face, hidden from the screen reader, above a hint. */
  it('draws the face above the hint, hidden from the screen reader', async () => {
    const { container, fixture } = await render(EmptyStateComponent, {
      inputs: { heading: 'Keine Rechnungen gefunden.' },
    });
    const face = container.querySelector('svg.es__face');
    expect(face).toHaveAttribute('aria-hidden', 'true');
    expect(face?.querySelectorAll('.es__eye')).toHaveLength(2);
    expect(face?.querySelector('.es__mouth')).toBeTruthy();
    expect(fixture.nativeElement).toHaveClass('es-host--face');
    expect(container.querySelector('.es__hintIcon')).toBeTruthy();
    expect(screen.getByText('Keine Rechnungen gefunden.')).toBeInTheDocument();
  });

  /** § NF/usability/controls/001361: the dots never move in step. */
  /** § NF/usability/controls/001364: the caller names the icon before the hint. */
  it('shows the icon of the caller before the hint', async () => {
    const { container, rerender } = await render(EmptyStateComponent, {
      inputs: { heading: 'Keine Einträge an diesem Tag.', icon: 'cal' },
    });
    expect(container.querySelector('.es__hintIcon [data-icon]')).toHaveAttribute(
      'data-icon',
      'cal',
    );
    await rerender({
      inputs: { heading: 'Keine Treffer', icon: 'searchOff' },
      partialUpdate: true,
    });
    expect(container.querySelector('.es__hintIcon [data-icon]')).toHaveAttribute(
      'data-icon',
      'searchOff',
    );
  });

  it('draws 13 dots, each with its own wobble and flicker period', async () => {
    const { container } = await render(EmptyStateComponent, {
      inputs: { heading: 'Leer' },
    });
    const wobbles = [...container.querySelectorAll<SVGGElement>('.es__dotWobble')];
    const dots = [...container.querySelectorAll<SVGCircleElement>('.es__dot')];
    expect(dots).toHaveLength(13);
    expect(new Set(wobbles.map((w) => w.style.animationDuration)).size).toBeGreaterThan(10);
    expect(new Set(dots.map((d) => d.style.animationDuration)).size).toBeGreaterThan(10);
  });

  /** § NF/usability/controls/001360: `shape` and `rows` no longer change the look. */
  it('draws the same face whatever shape and rows say', async () => {
    const { container } = await render(EmptyStateComponent, {
      inputs: { heading: 'Leer', shape: 'table', rows: 1 },
    });
    expect(container.querySelector('.es__face')).toBeTruthy();
    expect(container.querySelectorAll('.es__dot')).toHaveLength(13);
  });

  it('is a plain line, not a heading, inside a card or a dialog', async () => {
    await render(EmptyStateComponent, { inputs: { heading: 'Leer' } });
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Leer')).toBeInTheDocument();
  });

  it('takes an explicit heading level', async () => {
    await render(EmptyStateComponent, {
      inputs: { heading: 'Leer', level: 3 },
    });
    expect(screen.getByRole('heading', { level: 3, name: 'Leer' })).toBeInTheDocument();
  });

  it('accepts the level as a bare attribute', async () => {
    await render(`<app-empty-state heading="Leer" level="1" />`, {
      imports: [EmptyStateComponent],
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Leer' })).toBeInTheDocument();
  });

  it('draws no face but a glyph when plain, for a pane with nothing open', async () => {
    const { container, fixture } = await render(EmptyStateComponent, {
      inputs: { heading: 'Keine Aufgabe geöffnet', plain: true, icon: 'tasks' },
    });
    expect(container.querySelector('.es__face')).toBeNull();
    expect(container.querySelector('.es__hintIcon')).toBeNull();
    expect(container.querySelector('.es__icon')).toBeTruthy();
    expect(fixture.nativeElement).toHaveClass('es-host--plain');
  });

  it('shows the code instead of the glyph when plain', async () => {
    const { container } = await render(EmptyStateComponent, {
      inputs: { heading: 'Nicht gefunden', plain: true, code: '404' },
    });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(container.querySelector('.es__icon')).toBeNull();
  });

  it('projects a way to create something below the hint', async () => {
    await render(
      `<app-empty-state heading="Leer"><button type="button">Als Freitext anlegen</button></app-empty-state>`,
      { imports: [EmptyStateComponent] },
    );
    expect(
      screen.getByRole('button', { name: 'Als Freitext anlegen' }).closest('.es__action'),
    ).toBeTruthy();
  });

  it('stays at its own height by default, for cards and list rows', async () => {
    const { fixture } = await render(EmptyStateComponent, {
      inputs: { heading: 'Leer' },
    });
    expect(fixture.nativeElement).not.toHaveClass('es-host--fill');
  });

  it('fills the page when fill is set', async () => {
    const { fixture } = await render(EmptyStateComponent, {
      inputs: { heading: 'Leer', fill: true },
    });
    expect(fixture.nativeElement).toHaveClass('es-host--fill');
  });

  it('accepts fill as a bare attribute', async () => {
    const { container } = await render(`<app-empty-state heading="Leer" fill />`, {
      imports: [EmptyStateComponent],
    });
    expect(container.querySelector('app-empty-state')).toHaveClass('es-host--fill');
  });

  /** § NF/usability/controls/002650: a `fill` state takes the free height below its top. */
  it('measures the free height below a fill state in its scrolling box', async () => {
    const { fixture } = await render(EmptyStateComponent, {
      inputs: { heading: 'Noch keine Info', fill: true },
    });
    const host = fixture.nativeElement as HTMLElement;
    const box = document.createElement('div');
    document.body.append(box);
    box.append(host);
    box.style.overflowY = 'auto';
    box.style.paddingBottom = '20px';
    Object.defineProperty(box, 'clientHeight', { value: 600 });
    box.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    host.getBoundingClientRect = () => ({ top: 160 }) as DOMRect;
    window.dispatchEvent(new Event('resize'));
    expect(host.style.getPropertyValue('--es-free')).toBe('520px');
  });

  it('sets no free height without fill', async () => {
    const { fixture } = await render(EmptyStateComponent, { inputs: { heading: 'Nichts da' } });
    window.dispatchEvent(new Event('resize'));
    expect((fixture.nativeElement as HTMLElement).style.getPropertyValue('--es-free')).toBe('');
  });
});
