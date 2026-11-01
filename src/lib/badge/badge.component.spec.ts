import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/angular';
import { BadgeComponent, STATUS_SURFACES, statusTextColors } from './badge.component';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('BadgeComponent', () => {
  it('renders content with the default neutral variant', async () => {
    await render(`<app-badge>Entwurf</app-badge>`, { imports: [BadgeComponent] });
    const badge = screen.getByText('Entwurf');
    expect(badge).toHaveClass('badge--neutral');
  });

  it('applies the requested variant class', async () => {
    await render(`<app-badge variant="success">Angenommen</app-badge>`, {
      imports: [BadgeComponent],
    });
    expect(screen.getByText('Angenommen')).toHaveClass('badge--success');
  });

  it('shows a configured colour as status text, without a plate', async () => {
    await render(`<app-badge color="#3b82f6">Eingereicht</app-badge>`, { imports: [BadgeComponent] });
    const badge = screen.getByText('Eingereicht');
    expect(badge).toHaveClass('badge--custom', 'badge--status');
    expect(badge).not.toHaveClass('badge--neutral');
    expect(badge).not.toHaveClass('badge--tag');
    expect(badge.style.background).toBe('');
    const colors = statusTextColors('#3b82f6');
    expect(badge.style.getPropertyValue('--badge-text-light')).toBe(colors?.light);
    expect(badge.style.getPropertyValue('--badge-text-dark')).toBe(colors?.dark);
  });

  it('falls back to the variant when no color is set', async () => {
    await render(`<app-badge variant="info">Ohne</app-badge>`, { imports: [BadgeComponent] });
    const badge = screen.getByText('Ohne');
    expect(badge).toHaveClass('badge--info');
    expect(badge.style.background).toBe('');
    expect(badge.style.getPropertyValue('--badge-text-light')).toBe('');
  });
});

describe('statusTextColors', () => {
  it.each(['#3b82f6', '#8b5cf6', '#ffee88', '#222266', '#72a384', '#fff', '#000000', '#ef4444'])(
    'gives %s AA contrast on every status surface of both themes',
    (hex) => {
      const colors = statusTextColors(hex);
      expect(colors).not.toBeNull();
      for (const s of STATUS_SURFACES.light) expect(ratio(colors!.light, s)).toBeGreaterThanOrEqual(4.5);
      for (const s of STATUS_SURFACES.dark) expect(ratio(colors!.dark, s)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('keeps a colour that already has the contrast', () => {
    expect(statusTextColors('#1a1a1a')?.light).toBe('#1a1a1a');
    expect(statusTextColors('#eeeeee')?.dark).toBe('#eeeeee');
  });

  it('returns null for a missing or an invalid colour', () => {
    expect(statusTextColors(null)).toBeNull();
    expect(statusTextColors('')).toBeNull();
    expect(statusTextColors('not-a-color')).toBeNull();
  });

  it('checks against the surface values of tokens.scss', () => {
    const tokens = readFileSync(join(__dirname, '../../styles/tokens.scss'), 'utf8');
    const value = (name: string): string =>
      new RegExp(`--c-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens)?.[1]?.toLowerCase() ?? '';
    for (const theme of ['light', 'dark'] as const) {
      expect([...STATUS_SURFACES[theme]]).toEqual(
        ['bg', 'c1', 'c2', 'c3', 'sel'].map((n) => value(`${theme}-${n}`)),
      );
    }
  });
});
