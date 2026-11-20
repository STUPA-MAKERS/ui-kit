import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BAR_KEYS, BRAND, NAV } from '../../testing/shell';
import { BottomBarComponent } from './bottom-bar/bottom-bar.component';
import { NavRailComponent } from './nav-rail/nav-rail.component';
import { navGroups, type ShellNavGroupRef, type ShellNavItem } from './shell.types';

@Component({ standalone: true, template: 'page' })
class StubPage {}

const PUBLIC: ShellNavGroupRef = { key: 'public', label: 'Öffentlich', icon: 'globe' };
const GROUPED: ShellNavItem[] = [
  ...NAV,
  { key: 'protocols', path: '/protocols', label: 'Protokolle', icon: 'file', place: 'main', group: PUBLIC },
  { key: 'decisions', path: '/decisions', label: 'Beschlüsse', icon: 'vote', place: 'main', group: PUBLIC },
];

async function renderRail() {
  const view = await render(`<app-nav-rail [items]="nav" [brand]="brand" />`, {
    imports: [NavRailComponent],
    providers: [provideRouter([{ path: '**', component: StubPage }])],
    componentProperties: { nav: GROUPED, brand: BRAND },
  });
  return { ...view, router: view.fixture.debugElement.injector.get(Router) };
}

async function renderBar() {
  const view = await render(`<app-bottom-bar [items]="nav" [barKeys]="barKeys" />`, {
    imports: [BottomBarComponent],
    providers: [provideRouter([{ path: '**', component: StubPage }])],
    componentProperties: { nav: GROUPED, barKeys: [...BAR_KEYS, 'protocols'] },
  });
  return { ...view, router: view.fixture.debugElement.injector.get(Router) };
}

describe('navGroups', () => {
  it('collects the grouped entries per group, in the order of their first entry', () => {
    expect(navGroups(GROUPED)).toEqual([{ ...PUBLIC, items: GROUPED.slice(-2) }]);
    expect(navGroups(NAV)).toEqual([]);
  });
});

describe('a group in the rail', () => {
  it('shows the group as one closed entry after the main entries, and opens it', async () => {
    const { fixture, container } = await renderRail();
    const toggle = screen.getByRole('button', { name: 'Öffentlich' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.closest('.rail__main')).not.toBeNull();
    const labels = Array.from(container.querySelectorAll('.rail__main > .rail__item .rail__label')).map(
      (l) => l.textContent?.trim(),
    );
    expect(labels.at(-1)).toBe('Öffentlich');
    expect(screen.queryByRole('link', { name: 'Protokolle' })).toBeNull();

    await userEvent.click(toggle);
    fixture.detectChanges();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('group', { name: 'Öffentlich' });
    expect(within(group).getByRole('link', { name: 'Protokolle' })).toHaveAttribute('href', '/protocols');
    expect(within(group).getByRole('link', { name: 'Beschlüsse' })).toBeInTheDocument();

    await userEvent.click(toggle);
    fixture.detectChanges();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the group by itself on the page of one of its entries', async () => {
    const { fixture, router } = await renderRail();
    await router.navigateByUrl('/decisions');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Öffentlich' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Beschlüsse' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('a group in Mehr', () => {
  it('keeps grouped entries out of the bar and opens the group in the sheet', async () => {
    const { fixture } = await renderBar();
    const bar = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    expect(within(bar).queryByRole('link', { name: /Protokolle/ })).toBeNull();
    await userEvent.click(within(bar).getByRole('button', { name: 'Mehr' }));
    fixture.detectChanges();
    const sheet = screen.getByRole('dialog', { name: 'Mehr' });
    const toggle = within(sheet).getByRole('button', { name: 'Öffentlich' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    fixture.detectChanges();
    const group = within(sheet).getByRole('group', { name: 'Öffentlich' });
    expect(within(group).getByRole('link', { name: 'Protokolle' })).toHaveAttribute('href', '/protocols');
    await userEvent.click(toggle);
    fixture.detectChanges();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the group while the page is one of its entries, and marks Mehr active', async () => {
    const { fixture, router } = await renderBar();
    await router.navigateByUrl('/protocols');
    fixture.detectChanges();
    const bar = screen.getByRole('navigation', { name: 'Hauptnavigation' });
    const more = within(bar).getByRole('button', { name: 'Mehr' });
    expect(more).toHaveClass('is-active');
    await userEvent.click(more);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Öffentlich' })).toHaveAttribute('aria-expanded', 'true');
  });
});
