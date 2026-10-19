import { render } from '@testing-library/angular';
import { ConfigDiffComponent } from './config-diff.component';
import type { ConfigDiffData } from './config-diff.types';

describe('ConfigDiffComponent', () => {
  it('renders a row per changed/added/removed field', async () => {
    const diff: ConfigDiffData = {
      added: [{ key: 'field:new', value: 'X' }],
      removed: [{ key: 'field:old', value: 'Y' }],
      changed: [{ key: 'field:edit', old: 'A', new: 'B' }],
    };
    const { container } = await render(ConfigDiffComponent, { inputs: { diff } });
    const items = container.querySelectorAll('.cfg-diff li');
    expect(items.length).toBe(3);
    expect(container.textContent).toContain('field:edit');
    expect(container.textContent).toContain('field:new');
    expect(container.textContent).toContain('field:old');
  });

  it('shows the no-changes hint for a null diff', async () => {
    const { container } = await render(ConfigDiffComponent, { inputs: { diff: null } });
    expect(container.querySelector('.cfg-diff')).toBeNull();
    expect(container.querySelector('.cfg-diff__none')).not.toBeNull();
  });

  it('shows the no-changes hint for an all-empty diff', async () => {
    const diff: ConfigDiffData = { added: [], removed: [], changed: [] };
    const { container } = await render(ConfigDiffComponent, { inputs: { diff } });
    expect(container.querySelector('.cfg-diff')).toBeNull();
    expect(container.querySelector('.cfg-diff__none')).not.toBeNull();
  });

  it('JSON-encodes object values and dashes null', async () => {
    const diff: ConfigDiffData = {
      added: [{ key: 'k', value: { a: 1 } }],
      removed: [{ key: 'r', value: null }],
      changed: [],
    };
    const { container } = await render(ConfigDiffComponent, { inputs: { diff } });
    expect(container.textContent).toContain('{"a":1}');
    expect(container.textContent).toContain('—');
  });

  describe('compact', () => {
    const diff: ConfigDiffData = {
      added: [{ key: 'field:new', value: 'X' }],
      removed: [{ key: 'field:old', value: { a: 1 } }],
      changed: [{ key: 'field:edit', old: 'A', new: undefined }],
    };

    it('renders one code block: key, "-" old and "+" new, changed first', async () => {
      const { container } = await render(ConfigDiffComponent, { inputs: { diff, compact: true } });
      expect(container.querySelector('.cfg-diff')).toBeNull();
      expect(container.querySelector('app-badge')).toBeNull();
      const block = container.querySelector('.cfg-diff-code')!;
      expect(block).toHaveAttribute('role', 'group');
      expect(block).toHaveAttribute('aria-label', 'Änderungen');
      const items = [...block.querySelectorAll('.cfg-diff-code__item')];
      expect(items.map((i) => i.querySelector('.cfg-diff-code__key')!.textContent)).toEqual([
        'field:edit',
        'field:new',
        'field:old',
      ]);
      // changed: both lines; undefined reads as null, a string as JSON in quotes.
      expect(items[0].querySelector('.cfg-diff-code__del')!.textContent!.trim()).toBe(
        '- vorher: "A"',
      );
      expect(items[0].querySelector('.cfg-diff-code__ins')!.textContent!.trim()).toBe(
        '+ nachher: null',
      );
      // added: only the new value; removed: only the old one, objects as JSON.
      expect(items[1].querySelector('.cfg-diff-code__del')).toBeNull();
      expect(items[1].querySelector('.cfg-diff-code__ins')!.textContent).toContain('"X"');
      expect(items[2].querySelector('.cfg-diff-code__ins')).toBeNull();
      expect(items[2].querySelector('.cfg-diff-code__del')!.textContent).toContain('{"a":1}');
    });

    it('hides the "-" and "+" from the screen reader', async () => {
      const { container } = await render(ConfigDiffComponent, { inputs: { diff, compact: true } });
      const marks = container.querySelectorAll('.cfg-diff-code [aria-hidden="true"]');
      expect([...marks].map((m) => m.textContent)).toEqual(['- ', '+ ', '+ ', '- ']);
    });

    it.each<[string, ConfigDiffData | null]>([
      ['null', null],
      ['empty', { added: [], removed: [], changed: [] }],
    ])('shows the no-changes line inside the block for a %s diff', async (_, d) => {
      const { container } = await render(ConfigDiffComponent, {
        inputs: { diff: d, compact: true },
      });
      const none = container.querySelector('.cfg-diff-code .cfg-diff-code__none');
      expect(none?.textContent).toBe('Keine Änderungen');
      expect(container.querySelector('.cfg-diff__none')).toBeNull();
    });

    it('accepts compact as a bare attribute', async () => {
      const { container } = await render(`<app-config-diff [diff]="d" compact />`, {
        imports: [ConfigDiffComponent],
        componentProperties: { d: diff },
      });
      expect(container.querySelector('.cfg-diff-code')).not.toBeNull();
    });
  });
});
