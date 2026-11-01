import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { ListGroupComponent } from './list-group.component';

describe('ListGroupComponent', () => {
  it('names the group with its head and shows the projected rows', async () => {
    const { container } = await render(
      `<app-list-group label="September 2026">
        <div role="list"><div role="listitem">Antrag A</div><div role="listitem">Antrag B</div></div>
      </app-list-group>`,
      { imports: [ListGroupComponent] },
    );
    const head = screen.getByRole('heading', { level: 2, name: 'September 2026' });
    const group = screen.getByRole('region', { name: 'September 2026' });
    expect(group.tagName.toLowerCase()).toBe('app-list-group');
    expect(group.getAttribute('aria-labelledby')).toBe(head.id);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('shows the name only, never a count of the rows', async () => {
    await render(
      `<app-list-group label="Saved"><div role="list"><div role="listitem">A</div></div></app-list-group>`,
      { imports: [ListGroupComponent] },
    );
    expect(screen.getByRole('heading').textContent?.trim()).toBe('Saved');
  });

  it.each([null, ''])('has no head and no role without a label (%p)', async (label) => {
    const { container } = await render(
      `<app-list-group [label]="label"><div role="list"></div></app-list-group>`,
      { imports: [ListGroupComponent], componentProperties: { label } },
    );
    expect(screen.queryByRole('heading')).toBeNull();
    const host = container.querySelector('app-list-group');
    expect(host).not.toHaveAttribute('role');
    expect(host).not.toHaveAttribute('aria-labelledby');
  });

  it('shows a hidden placeholder bar in place of the head while the list loads', async () => {
    const { container } = await render(`<app-list-group skeleton="7rem" label="Mai" />`, {
      imports: [ListGroupComponent],
    });
    const head = container.querySelector('.lg__head');
    expect(head).toHaveAttribute('aria-hidden', 'true');
    expect(head?.querySelector('.skel-text')).toHaveStyle({ width: '7rem' });
    expect(head?.textContent?.trim()).toBe('');
    expect(container.querySelector('app-list-group')).not.toHaveAttribute('role');
  });

  it('colours the head of a group that waits for somebody', async () => {
    const { container } = await render(`<app-list-group label="Überfällig" tone="warn" />`, {
      imports: [ListGroupComponent],
    });
    expect(container.querySelector('.lg__head')).toHaveClass('lg__head--warn');
  });

  it('gives each group its own head id', async () => {
    await render(`<app-list-group label="A" /><app-list-group label="B" />`, {
      imports: [ListGroupComponent],
    });
    const [a, b] = screen.getAllByRole('heading');
    expect(a.id).not.toBe(b.id);
  });

  it('moves the head up in the first group and near the edge on a phone', () => {
    const scss = readFileSync(join(__dirname, 'list-group.component.scss'), 'utf8');
    expect(scss).toMatch(/:host\(:first-child\) \.lg__head \{\s*padding-top: var\(--space-2\);/);
    expect(scss).toMatch(/@include bp\.phone \{\s*\.lg__head \{\s*padding-inline: var\(--space-1\);/);
  });
});
