import { provideRouter } from '@angular/router';
import { render } from '@testing-library/angular';
import { of } from 'rxjs';

import { fakePorts, minimalConfig } from '../../../testing/framework';
import { provideFramework } from './framework';
import { FrameworkSearchComponent } from './framework-search.component';
import { runAxe } from '../../../testing/a11y';

async function setUp() {
  const search = jest.fn(() =>
    of([
      {
        kind: 'Anträge',
        title: 'Antrag A-1',
        sub: 'Eingereicht',
        icon: 'file' as const,
        link: { commands: ['/applications', 'a1'] },
      },
    ]),
  );
  const config = { ...minimalConfig(), ports: fakePorts({ search }) };
  const view = await render(FrameworkSearchComponent, {
    providers: [provideRouter([]), provideFramework(config)],
  });
  return { component: view.fixture.componentInstance, search, fixture: view.fixture };
}

// §S/framework/shell/002261
describe('FrameworkSearchComponent', () => {
  afterEach(() => jest.useRealTimers());

  it('shows the matching pages at once and the hits of the port after the debounce', async () => {
    jest.useFakeTimers();
    const { component, search } = await setUp();
    component.onQuery('an');
    expect(component.groups()).toEqual([
      {
        label: 'Seiten',
        rows: [expect.objectContaining({ title: 'Anträge', link: '/applications' })],
      },
    ]);
    jest.advanceTimersByTime(200);
    expect(search).toHaveBeenCalledWith('an');
    expect(component.groups()[1]).toEqual({
      label: 'Anträge',
      rows: [expect.objectContaining({ title: 'Antrag A-1', link: '/applications/a1' })],
    });
  });

  it('does not ask the port below two characters', async () => {
    jest.useFakeTimers();
    const { component, search } = await setUp();
    component.onQuery('a');
    jest.advanceTimersByTime(200);
    expect(search).not.toHaveBeenCalled();
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations', async () => {
    const { fixture } = await setUp();
    expect(await runAxe(fixture.nativeElement)).toHaveNoViolations();
  });
});
