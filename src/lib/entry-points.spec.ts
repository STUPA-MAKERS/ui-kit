import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** The entry points of S/framework/packages/002214, as folders with an ng-package.json. */
const EXPECTED = [
  '.',
  'markdown-editor',
  'markdown-view',
  'pwa',
  'screens',
  'shell',
  'views/activity',
  'views/board',
  'views/calendar',
  'views/chat',
  'views/flow-editor',
  'views/form-editor',
  'views/graph',
  'views/meeting',
  'views/plan-table',
  'views/protocol',
  'views/voting',
];

const ROOT = join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.angular', '.git', 'src', 'testing', 'docs', 'specs', 'scripts']);

function entryPoints(dir: string, rel: string): readonly string[] {
  const here = existsSync(join(dir, 'ng-package.json')) ? [rel] : [];
  const children = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !SKIP.has(d.name))
    .flatMap((d) => entryPoints(join(dir, d.name), rel === '.' ? d.name : `${rel}/${d.name}`));
  return [...here, ...children];
}

describe('entry points §S/framework/packages/002214', () => {
  it('has exactly the entry points of the spec table', () => {
    expect([...entryPoints(ROOT, '.')].sort()).toEqual(EXPECTED);
  });
});
