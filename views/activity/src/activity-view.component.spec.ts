import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { LoadState } from '@stupa-makers/ui-kit';

import { ACTIVITY_ENTRIES } from '../../../testing/activity';
import { runAxe } from '../../../testing/a11y';
import { matchOnly } from '../../../testing/media';
import { ActivityViewComponent } from './activity-view.component';
import { activityDays, type ActivityEntry } from './activity.types';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [ActivityViewComponent],
  template: `<app-activity-view
    [entries]="entries()"
    [loadingMore]="loadingMore()"
    emptyBody="Hier erscheint, was passiert."
    (more)="onMore()"
  />`,
})
class Host {
  readonly entries = input<LoadState<readonly ActivityEntry[]>>({ state: 'ready', data: ACTIVITY_ENTRIES });
  readonly loadingMore = input(false);
  onMore = jest.fn();
}

async function setup(inputs: Partial<{ entries: LoadState<readonly ActivityEntry[]>; loadingMore: boolean }> = {}) {
  const view = await render(Host, { inputs, providers: [provideRouter([])] });
  return { view, host: view.fixture.componentInstance };
}

describe('activityDays', () => {
  it('groups entries in a row with the same day label', () => {
    expect(activityDays(ACTIVITY_ENTRIES).map((d) => [d.label, d.entries.length])).toEqual([
      ['Heute', 2],
      ['Gestern', 1],
    ]);
    expect(activityDays([])).toEqual([]);
  });
});

describe('ActivityViewComponent §S/framework/views/002280', () => {
  it('shows the entries by day, each row with item, actor, change and time', async () => {
    const { view } = await setup();
    expect(screen.getByRole('region', { name: 'Heute' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Gestern' })).toBeTruthy();
    expect(screen.getByText('Zuschuss Sommerfest')).toBeTruthy();
    expect(screen.getByText(/Bob Beispiel · Kommentar: Danke/)).toBeTruthy();
    expect(screen.getByText('Protokoll finalisiert')).toBeTruthy();
    expect(screen.getByText('14:05')).toBeTruthy();
    const link = view.container.querySelector('a[href="/todos?card=c7"]');
    expect(link).toBeTruthy();
  });

  it('marks a new entry with a dot and a hidden word', async () => {
    const { view } = await setup();
    expect(view.container.querySelectorAll('.acv__dot')).toHaveLength(1);
    expect(screen.getByText('Neu:')).toBeTruthy();
  });

  it('shows grey rows while the first page loads', async () => {
    const { view } = await setup({ entries: { state: 'loading' } });
    expect(view.container.querySelector('app-skeleton')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows the face for an empty list and for a failed load', async () => {
    const { view } = await setup({ entries: { state: 'empty', heading: 'Noch keine Aktivität', icon: 'history' } });
    expect(screen.getByText('Noch keine Aktivität')).toBeTruthy();
    expect(screen.getByText('Hier erscheint, was passiert.')).toBeTruthy();
    view.fixture.componentRef.setInput('entries', { state: 'error', message: 'Kaputt', retry: () => undefined });
    view.fixture.detectChanges();
    expect(screen.getByText('Kaputt')).toBeTruthy();
  });

  it('emits more from the button when more entries follow', async () => {
    const { host } = await setup({ entries: { state: 'ready', data: ACTIVITY_ENTRIES, more: true } });
    await userEvent.click(screen.getByRole('button', { name: /Mehr laden/ }));
    expect(host.onMore).toHaveBeenCalledTimes(1);
  });

  it('emits nothing while the next entries load, and shows no button at the end', async () => {
    const { host, view } = await setup({ entries: { state: 'ready', data: ACTIVITY_ENTRIES, more: true }, loadingMore: true });
    (view.fixture.debugElement.children[0].componentInstance as { loadMore(): void }).loadMore();
    expect(host.onMore).not.toHaveBeenCalled();
    view.fixture.componentRef.setInput('entries', { state: 'ready', data: ACTIVITY_ENTRIES });
    view.fixture.detectChanges();
    expect(screen.queryByRole('button', { name: /Mehr laden/ })).toBeNull();
  });

  it('drops the arrow on a phone', async () => {
    const restore = matchOnly('(max-width: 767.98px)');
    try {
      const { view } = await setup();
      expect(view.container.querySelector('.acv__chevron')).toBeNull();
    } finally {
      restore();
    }
  });

  it('has no axe violations', async () => {
    const { view } = await setup({ entries: { state: 'ready', data: ACTIVITY_ENTRIES, more: true } });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
