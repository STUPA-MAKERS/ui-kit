import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { Action, LoadState, ScreenHead, ScreenTab, SideSheetDef } from '@stupa-makers/ui-kit';

import { runAxe } from '../../../testing/a11y';
import { DETAIL_HEAD, DETAIL_SHEETS, DETAIL_TABS } from '../../../testing/screens';
import {
  DetailScreenComponent,
  ScreenBodyDirective,
  ScreenCommentsDirective,
  ScreenSheetDirective,
  ScreenTabDirective,
  type ScreenComments,
} from './detail-screen.component';

/** A page that fills every slot of the screen. */
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [
    DetailScreenComponent,
    ScreenTabDirective,
    ScreenBodyDirective,
    ScreenSheetDirective,
    ScreenCommentsDirective,
  ],
  template: `
    <app-detail-screen
      [head]="head()"
      [state]="state()"
      [tabs]="tabs()"
      [actions]="actions()"
      [sheets]="sheets()"
      [comments]="comments()"
      (action)="onAction($event.key)"
      (tabChange)="onTab($event)"
      (sheetChange)="onSheet($event.key, $event.open)"
    >
      <ng-template screenTab="data"><p>Die Angaben</p></ng-template>
      <ng-template screenTab="history"><p>Der Verlauf</p></ng-template>
      <ng-template screenBody><p>Der Inhalt</p></ng-template>
      <ng-template screenSheet="votes"><p>Die Abstimmungen</p></ng-template>
      <ng-template screenSheet="links"><p>Die Verknüpfungen</p></ng-template>
      <ng-template screenComments><p>Die Kommentare</p></ng-template>
    </app-detail-screen>
  `,
})
class Host {
  readonly head = input<ScreenHead>(DETAIL_HEAD);
  readonly state = input<LoadState<unknown>>({ state: 'ready', data: {} });
  readonly tabs = input<readonly ScreenTab[]>([]);
  readonly actions = input<readonly Action[]>([]);
  readonly sheets = input<readonly SideSheetDef[]>([]);
  readonly comments = input<ScreenComments | null>(null);
  onAction = jest.fn();
  onTab = jest.fn();
  onSheet = jest.fn();
}

async function setUp(inputs: Partial<Record<keyof Host, unknown>> = {}) {
  const view = await render(Host, {
    inputs,
    providers: [provideRouter([])],
  });
  return { view, host: view.fixture.componentInstance };
}

// §S/framework/screens/002241 §S/framework/screens/002216
describe('DetailScreenComponent', () => {
  it('shows the head with title, kicker, status and meta chips, and the body', async () => {
    await setUp();
    expect(screen.getByRole('heading', { level: 1, name: 'Zuschuss Sommerfest' })).toBeTruthy();
    expect(screen.getByText('Antrag A-0042')).toBeInTheDocument();
    expect(screen.getByText('In Prüfung')).toBeInTheDocument();
    expect(screen.getByText('Fachschaft Informatik')).toBeInTheDocument();
    expect(screen.getByText('Der Inhalt')).toBeInTheDocument();
  });

  it('shows the skeleton while loading and the error with a retry', async () => {
    const retry = jest.fn();
    const { view } = await setUp({ state: { state: 'loading' } });
    expect(view.container.querySelector('app-skeleton')).not.toBeNull();
    expect(screen.queryByText('Der Inhalt')).toBeNull();
    view.fixture.componentRef.setInput('state', { state: 'error', message: 'Fehler', retry });
    view.fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(retry).toHaveBeenCalled();
  });

  it('shows the visible tabs, keeps the open tab in the URL and emits it', async () => {
    const { host, view } = await setUp({ tabs: DETAIL_TABS });
    expect(screen.getAllByRole('tab').map((t) => t.textContent?.trim())).toEqual([
      'Antrag',
      'Verlauf',
    ]);
    expect(screen.getByText('Die Angaben')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Verlauf' }));
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(screen.getByText('Der Verlauf')).toBeInTheDocument();
    expect(host.onTab).toHaveBeenCalledWith('history');
    expect(TestBed.inject(Router).url).toContain('tab=history');
  });

  it('emits a head action by its key', async () => {
    const { host } = await setUp({
      actions: [{ key: 'edit', label: 'Bearbeiten', icon: 'edit', priority: 'head' }],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    expect(host.onAction).toHaveBeenCalledWith('edit');
  });

  it('opens a side sheet from its edge tab', async () => {
    const { host, view } = await setUp({ sheets: DETAIL_SHEETS });
    await userEvent.click(screen.getByRole('button', { name: 'Abstimmungen' }));
    view.fixture.detectChanges();
    expect(host.onSheet).toHaveBeenCalledWith('votes', true);
    expect(screen.getByRole('dialog', { name: 'Abstimmungen' })).toBeInTheDocument();
  });

  it('toggles the comments from the head button', async () => {
    const { host } = await setUp({ comments: { open: false, label: 'Kommentare' } });
    const button = screen.getByRole('button', { name: 'Kommentare' });
    expect(
      button.getAttribute('aria-pressed') ??
        button.querySelector('button')?.getAttribute('aria-pressed'),
    ).toBe('false');
    await userEvent.click(button);
    expect(host.onSheet).toHaveBeenCalledWith('comments', true);
  });

  // §NF/accessibility/conformance/000493
  it('has no axe violations', async () => {
    const { view } = await setUp({
      tabs: DETAIL_TABS,
      sheets: DETAIL_SHEETS,
      comments: { open: false, label: 'Kommentare' },
      actions: [{ key: 'edit', label: 'Bearbeiten', icon: 'edit', priority: 'head' }],
    });
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
