import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { NavMarkDirective } from '../nav-mark.directive';
import { RailButtonComponent } from '../nav-item/nav-item-buttons';
import type { ShellBrand } from '../shell.types';
import { BRAND, NAV, TestMarkComponent } from '../../../testing/shell';
import { NavRailComponent } from './nav-rail.component';

@Component({ standalone: true, template: 'page' })
class StubPage {}

async function renderRail(inputs: { searchable?: boolean; brand?: ShellBrand } = {}) {
  const searched = jest.fn();
  const view = await render(
    `<ng-template #m appNavMark let-key let-part="part"><app-test-mark [key]="key" [part]="part" /></ng-template>
    <app-nav-rail [items]="nav" [brand]="brand" [searchable]="searchable" [mark]="m" (search)="searched()">
      <button railTools type="button" class="tools">Hilfe</button>
      <app-rail-button railEnd icon="moon" label="Dunkel" />
      <button railAccount type="button" class="account">Konto</button>
    </app-nav-rail>`,
    {
      imports: [NavRailComponent, NavMarkDirective, TestMarkComponent, RailButtonComponent],
      providers: [provideRouter([{ path: '**', component: StubPage }])],
      componentProperties: {
        nav: NAV,
        brand: inputs.brand ?? BRAND,
        searchable: inputs.searchable ?? true,
        searched,
      },
    },
  );
  return {
    ...view,
    searched,
    router: view.fixture.debugElement.injector.get(Router),
  };
}

const rail = () => screen.getByRole('navigation', { name: 'Hauptnavigation' });

describe('NavRailComponent', () => {
  it('names the brand mark after the app and links it to the start page', async () => {
    await renderRail();
    expect(screen.getByRole('link', { name: 'STUPA, Start' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('shows one mark per theme when the brand has two', async () => {
    const { container } = await renderRail({
      brand: {
        home: '/home',
        label: 'Box',
        mark: { light: 'l.svg', dark: 'd.svg' },
      },
    });
    expect(container.querySelector('.rail__mark--light')).toHaveAttribute('src', 'l.svg');
    expect(container.querySelector('.rail__mark--dark')).toHaveAttribute('src', 'd.svg');
  });

  it('lists the main entries in order and the end entries after the spacer, then the slots', async () => {
    const { container } = await renderRail();
    const labels = Array.from(rail().querySelectorAll('.rail__main .rail__label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels).toEqual(['Start', 'Anträge', 'Aufgaben', 'Sitzungen', 'Budget', 'Tickets']);
    const nav = container.querySelector('nav.rail') as HTMLElement;
    const children = Array.from(nav.children).map((c) => c.className.split(' ')[0]);
    const spacer = children.indexOf('rail__spacer');
    expect(children.slice(spacer + 1)).toEqual([
      'rail__tools',
      'rail__item',
      'rail__end',
      'rail__account',
    ]);
    expect(within(rail()).getByRole('link', { name: 'Verwaltung' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(within(rail()).getByRole('button', { name: 'Dunkel' })).toHaveClass('rail__item');
  });

  it('carries the marks of the app on the icon and in the name', async () => {
    const { container } = await renderRail();
    expect(within(rail()).getByRole('link', { name: 'Aufgaben 8 offen' })).toHaveAttribute(
      'href',
      '/tasks',
    );
    expect(container.querySelectorAll('.rail__ind .mark__count')).toHaveLength(2);
  });

  it('emits search from the search entry, with the shortcut named', async () => {
    const { searched } = await renderRail();
    const button = within(rail()).getByRole('button', { name: 'Suche' });
    expect(button).toHaveAttribute(
      'aria-keyshortcuts',
      expect.stringMatching(/^(Control|Meta)\+K$/),
    );
    button.click();
    expect(searched).toHaveBeenCalledTimes(1);
  });

  it('has no search entry when the app has no search', async () => {
    await renderRail({ searchable: false });
    expect(within(rail()).queryByRole('button', { name: 'Suche' })).not.toBeInTheDocument();
  });

  it('marks the entry of the current page', async () => {
    const { router, fixture } = await renderRail();
    await router.navigateByUrl('/tasks');
    fixture.detectChanges();
    expect(within(rail()).getByRole('link', { name: /^Aufgaben/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(rail()).getByRole('link', { name: 'Start' })).not.toHaveAttribute('aria-current');
  });

  it('scrolls the active entry into view when the rail is too low (000660)', async () => {
    const { router, fixture, container } = await renderRail();
    const main = container.querySelector<HTMLElement>('.rail__main')!;
    const entry = within(rail()).getByRole('link', { name: /^Aufgaben/ });
    const rect = (top: number, bottom: number) => ({ top, bottom }) as DOMRect;
    jest.spyOn(main, 'getBoundingClientRect').mockReturnValue(rect(100, 300));
    jest.spyOn(entry, 'getBoundingClientRect').mockReturnValue(rect(360, 424));

    await router.navigateByUrl('/tasks');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(main.scrollTop).toBe(124);

    jest.spyOn(entry, 'getBoundingClientRect').mockReturnValue(rect(40, 104));
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    main.scrollTop = 124;
    await router.navigateByUrl('/tasks');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(main.scrollTop).toBe(64);
  });

  it('leaves the scroll position when the active entry is in view', async () => {
    const { router, fixture, container } = await renderRail();
    const main = container.querySelector<HTMLElement>('.rail__main')!;
    const entry = within(rail()).getByRole('link', { name: /^Aufgaben/ });
    jest.spyOn(main, 'getBoundingClientRect').mockReturnValue({ top: 100, bottom: 300 } as DOMRect);
    jest.spyOn(entry, 'getBoundingClientRect').mockReturnValue({ top: 120, bottom: 184 } as DOMRect);
    await router.navigateByUrl('/tasks');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(main.scrollTop).toBe(0);
  });

  it('has no axe violations', async () => {
    const { container } = await renderRail();
    expect(await runAxe(container)).toHaveNoViolations();
  });
});
