import { render } from '@testing-library/angular';
import { IconComponent } from './icon.component';
import { ICON_NAMES, iconShapes } from './icons';

describe('IconComponent', () => {
  it('renders a decorative line icon as inline SVG', async () => {
    const { container } = await render(`<app-icon name="sun" />`, { imports: [IconComponent] });
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('data-icon', 'sun');
    expect(svg?.querySelector('circle')).toBeTruthy();
  });

  it('draws the shapes of the named icon', async () => {
    const { container } = await render(`<app-icon name="search" />`, { imports: [IconComponent] });
    expect(container.querySelector('circle')).toHaveAttribute('r', '7');
    expect(container.querySelector('path')).toHaveAttribute('d', 'm20 20-3.5-3.5');
  });

  it('draws ellipses', async () => {
    const { container } = await render(`<app-icon name="db" />`, { imports: [IconComponent] });
    expect(container.querySelector('ellipse')).toHaveAttribute('rx', '8');
  });

  it('draws rects with their corner radius', async () => {
    const { container } = await render(`<app-icon name="cal" />`, { imports: [IconComponent] });
    expect(container.querySelector('rect')).toHaveAttribute('rx', '2');
  });

  it('fills a shape that asks for it', async () => {
    const { container } = await render(`<app-icon name="half" />`, { imports: [IconComponent] });
    expect(container.querySelector('path')).toHaveAttribute('fill', 'currentColor');
    expect(container.querySelector('circle')).not.toHaveAttribute('fill');
  });

  it('honours the size and stroke width inputs', async () => {
    const { container } = await render(`<app-icon name="sun" [size]="32" [strokeWidth]="2" />`, {
      imports: [IconComponent],
    });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveAttribute('stroke-width', '2');
  });

  it('defaults the size to 18px', async () => {
    const { container } = await render(`<app-icon name="sun" />`, { imports: [IconComponent] });
    expect(container.querySelector('svg')).toHaveAttribute('width', '18');
  });

  it('draws a plain circle for an unknown icon name', async () => {
    const { container } = await render(`<app-icon [name]="name" />`, {
      imports: [IconComponent],
      componentProperties: { name: 'does-not-exist' as never },
    });
    expect(container.querySelectorAll('svg > *')).toHaveLength(1);
    expect(container.querySelector('circle')).toHaveAttribute('r', '9');
  });

  it('updates the drawing when the name input changes', async () => {
    const view = await render(`<app-icon [name]="name" />`, {
      imports: [IconComponent],
      componentProperties: { name: 'sun' as const },
    });
    expect(view.container.querySelector('svg')).toHaveAttribute('data-icon', 'sun');
    view.rerender({ componentProperties: { name: 'moon' as const } });
    expect(view.container.querySelector('svg')).toHaveAttribute('data-icon', 'moon');
    expect(view.container.querySelector('circle')).toBeNull();
  });

  it('keeps the older names and draws them with the new set', async () => {
    expect(iconShapes('delete')).toBe(iconShapes('trash'));
    expect(iconShapes('chevron-down')).toBe(iconShapes('down'));
    expect(iconShapes('paperclip-slash')?.length).toBe((iconShapes('clip')?.length ?? 0) + 1);
  });

  it('has a drawing for every name of the set', () => {
    for (const name of ICON_NAMES) {
      expect(iconShapes(name)?.length).toBeGreaterThan(0);
    }
  });

  it('has the icons of the navigation rail and the boards', () => {
    for (const name of ['home', 'file', 'tasks', 'users', 'vote', 'pie', 'swap', 'receipt', 'shield', 'more', 'tune']) {
      expect(ICON_NAMES).toContain(name);
    }
  });

  it('has a pin and a crossed-out pin for the pinned backups', () => {
    expect(ICON_NAMES).toContain('pin');
    expect(ICON_NAMES).toContain('pinslash');
    // The crossed-out pin is a pin with the slash, not the paperclip.
    expect(iconShapes('pinslash')).not.toBe(iconShapes('clipslash'));
    expect(iconShapes('pinslash')?.some((s) => s.d === 'm2 2 20 20')).toBe(true);
  });
});
