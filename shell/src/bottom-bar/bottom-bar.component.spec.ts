import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { BAR_KEYS, NAV, TestMarkComponent } from '../../../testing/shell';
import { NavMarkDirective } from '../nav-mark.directive';
import { BarButtonComponent } from '../nav-item/nav-item-buttons';
import { BottomBarComponent } from './bottom-bar.component';

@Component({ standalone: true, template: 'page' })
class StubPage {}

async function setup(opts: { searchable?: boolean; more?: boolean; barKeys?: string[] } = {}) {
  const search = jest.fn();
  const view = await render(
    `<ng-template #m appNavMark let-key let-part="part"><app-test-mark [key]="key" [part]="part" /></ng-template>
    <app-bottom-bar [items]="nav" [barKeys]="barKeys" [searchable]="searchable" [more]="more"
      [morePaths]="['/account']" [mark]="m" (search)="search()">
      <app-bar-button barEnd icon="moon" label="Dunkel" />
      <div more role="group" aria-label="Hilfe"><button type="button">Problem melden</button></div>
      <div moreAccount class="account">Ada Admin</div>
    </app-bottom-bar>`,
    {
      imports: [BottomBarComponent, NavMarkDirective, TestMarkComponent, BarButtonComponent],
      providers: [provideRouter([{ path: '**', component: StubPage }])],
      componentProperties: {
        nav: NAV,
        barKeys: opts.barKeys ?? BAR_KEYS,
        searchable: opts.searchable ?? true,
        more: opts.more ?? true,
        search,
      },
    },
  );
  return {
    ...view,
    search,
    router: view.fixture.debugElement.injector.get(Router),
  };
}

const bar = () => screen.getByRole('navigation', { name: 'Hauptnavigation' });
const more = () => within(bar()).getByRole('button', { name: 'Mehr' });

describe('BottomBarComponent', () => {
  it('shows the bar entries in bar order, the item of the app, then Mehr', async () => {
    await setup();
    const labels = Array.from(bar().querySelectorAll('.bb__label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels).toEqual(['Start', 'Anträge', 'Sitzungen', 'Aufgaben', 'Dunkel', 'Mehr']);
    expect(within(bar()).getByRole('link', { name: 'Aufgaben 8 offen' })).toHaveAttribute(
      'href',
      '/tasks',
    );
  });

  /** A's order in the sheet: the other entries, the search, the extra groups, the account. */
  it('lists the other entries, the search, the extra groups and the account in the Mehr sheet', async () => {
    const { fixture } = await setup();
    expect(more()).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more());
    fixture.detectChanges();
    const sheet = screen.getByRole('dialog', { name: 'Mehr' });
    for (const name of ['Budget', 'Verwaltung']) {
      expect(within(sheet).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(sheet).queryByRole('link', { name: 'Start' })).not.toBeInTheDocument();
    const tickets = within(sheet).getByRole('link', {
      name: 'Tickets 2 offen',
    });
    expect(tickets.querySelector('.mark__count--inline')).toHaveTextContent('2');
    const order = Array.from(
      sheet.querySelectorAll('.more__item, [role="group"][aria-label="Hilfe"], .account'),
    ).map((n) => n.textContent?.trim());
    expect(order.slice(-4)).toEqual(['Verwaltung', 'Suche', 'Problem melden', 'Ada Admin']);
  });

  it('emits search from the sheet and closes the sheet', async () => {
    const { fixture, search } = await setup();
    await userEvent.click(more());
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('button', { name: 'Suche' }));
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Mehr' })).not.toBeInTheDocument();
  });

  it('has no search in the sheet when the app has no search', async () => {
    const { fixture } = await setup({ searchable: false });
    await userEvent.click(more());
    fixture.detectChanges();
    expect(screen.queryByRole('button', { name: 'Suche' })).not.toBeInTheDocument();
  });

  it('closes the sheet when a link in it is followed', async () => {
    const { fixture } = await setup();
    await userEvent.click(more());
    fixture.detectChanges();
    await userEvent.click(screen.getByRole('link', { name: 'Budget' }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(screen.queryByRole('dialog', { name: 'Mehr' })).not.toBeInTheDocument();
  });

  it('marks Mehr as active on a page that lives in the sheet or under a more path', async () => {
    const { fixture, router } = await setup();
    await router.navigateByUrl('/budget');
    fixture.detectChanges();
    expect(more()).toHaveClass('is-active');
    await router.navigateByUrl('/account/notifications');
    fixture.detectChanges();
    expect(more()).toHaveClass('is-active');
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    expect(more()).not.toHaveClass('is-active');
    expect(within(bar()).getByRole('link', { name: 'Start' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('has no Mehr when the app turns it off, so every entry and its own item fill the bar', async () => {
    await setup({
      more: false,
      barKeys: ['start', 'applications', 'tasks', 'meetings'],
    });
    const labels = Array.from(bar().querySelectorAll('.bb__label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels).toEqual(['Start', 'Anträge', 'Aufgaben', 'Sitzungen', 'Dunkel']);
    expect(within(bar()).queryByRole('button', { name: 'Mehr' })).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = await setup();
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
