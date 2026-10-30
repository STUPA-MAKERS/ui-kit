import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { Router, provideRouter, type Routes } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PageFrame } from '@stupa-makers/ui-kit';
import { runAxe } from '../../../testing/a11y';
import { BAR_KEYS, BRAND, NAV, TestMarkComponent } from '../../../testing/shell';
import { NavMarkDirective } from '../nav-mark.directive';
import { BarButtonComponent, RailButtonComponent } from '../nav-item/nav-item-buttons';
import type { ShellFrame } from '../shell.types';
import { ShellComponent } from './shell.component';

@Component({ standalone: true, template: '<h1>Seite</h1>' })
class StubPage {}

const ROUTES: Routes = [
  { path: 'dashboard', component: StubPage },
  { path: 'protocols', component: StubPage, data: { footer: true } },
  { path: 'tasks', component: StubPage },
  { path: 'beamer', component: StubPage, data: { chrome: false } },
  { path: 'start', component: StubPage, data: { fab: true } },
  { path: 'board', component: StubPage, data: { fill: true } },
  {
    path: 'budget',
    component: StubPage,
    children: [{ path: 'wide', component: StubPage, data: { wide: true } }],
  },
];

/** Let `matchMedia` report a phone viewport for the phone media query only. */
function phoneViewport(): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: query === '(max-width: 768px)',
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  return () => (window.matchMedia = original);
}

const TEMPLATE = `
  <app-shell
    [frame]="frame()"
    [nav]="nav"
    [barKeys]="barKeys"
    [brand]="brand"
    [searchable]="searchable"
    [more]="more"
    [outlet]="outlet()"
    (search)="search()"
  >
    <ng-template appNavMark let-key let-part="part"><app-test-mark [key]="key" [part]="part" /></ng-template>
    <button shellRailTools type="button">Hilfe</button>
    <app-rail-button shellRailEnd icon="moon" label="Dunkel" />
    <app-bar-button shellBarEnd icon="moon" label="Dunkel" />
    <div shellAccount class="account">Konto von Mia</div>
    <div shellMore class="more-extra">Hilfe-Gruppe</div>
    <header shellPublicHeader class="public-header">Anmelden</header>
    <footer shellFooter>© Studierendenschaft</footer>
    @if (!outlet()) {
      <p shellMain>Offline</p>
    }
    <div shellOverlays class="palette">Palette</div>
    <div shellPrompts class="prompt">Neue Version</div>
  </app-shell>
`;

async function setup(opts: { frame?: ShellFrame; searchable?: boolean; more?: boolean } = {}) {
  const frame = signal<ShellFrame>(opts.frame ?? 'rail');
  const outlet = signal(true);
  const search = jest.fn();
  const view = await render(TEMPLATE, {
    imports: [
      ShellComponent,
      NavMarkDirective,
      TestMarkComponent,
      RailButtonComponent,
      BarButtonComponent,
    ],
    providers: [provideRouter(ROUTES)],
    componentProperties: {
      frame,
      outlet,
      nav: NAV,
      barKeys: BAR_KEYS,
      brand: BRAND,
      searchable: opts.searchable ?? true,
      more: opts.more ?? true,
      search,
    },
  });
  const injector = view.fixture.debugElement.injector;
  const router = injector.get(Router);
  await router.navigateByUrl('/dashboard');
  view.fixture.detectChanges();
  return {
    ...view,
    frame,
    outlet,
    search,
    router,
    pageFrame: injector.get(PageFrame),
  };
}

const mainNav = () => screen.queryByRole('navigation', { name: 'Hauptnavigation' });

describe('ShellComponent', () => {
  describe('frame', () => {
    it('shows no frame while the session is not known yet', async () => {
      const { container } = await setup({ frame: 'pending' });
      expect(mainNav()).not.toBeInTheDocument();
      expect(container.querySelector('.public-header')).toBeNull();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      expect(container.querySelector('main#main')).not.toBeNull();
      expect(container.querySelector('.palette')).toBeNull();
    });

    it('frames a signed-out visitor with the public header and the footer, without navigation', async () => {
      const { container } = await setup({ frame: 'public' });
      expect(container.querySelector('.public-header')).not.toBeNull();
      expect(mainNav()).not.toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toHaveTextContent('© Studierendenschaft');
      expect(container.querySelector('.palette')).toBeNull();
    });

    it('frames a signed-in person with the rail, the overlays and no footer', async () => {
      const { container } = await setup();
      expect(mainNav()).toBeInTheDocument();
      expect(container.querySelector('app-nav-rail')).not.toBeNull();
      expect(container.querySelector('app-bottom-bar')).toBeNull();
      expect(container.querySelector('.public-header')).toBeNull();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      expect(container.querySelector('.palette')).not.toBeNull();
      expect(within(mainNav() as HTMLElement).getByText('Konto von Mia')).toBeInTheDocument();
      expect(
        within(mainNav() as HTMLElement).getByRole('button', { name: 'Hilfe' }),
      ).toBeInTheDocument();
    });

    it('renders the load bar, the toasts and the prompts in every frame', async () => {
      const { container } = await setup({ frame: 'public' });
      expect(container.querySelector('app-load-bar')).not.toBeNull();
      expect(container.querySelector('app-toast')).not.toBeNull();
      expect(container.querySelector('.prompt')).not.toBeNull();
    });

    it('shows a route with `chrome: false` without rail, bars or footer, and brings the frame back', async () => {
      const { router, fixture, container } = await setup();
      await router.navigateByUrl('/beamer');
      fixture.detectChanges();
      expect(mainNav()).not.toBeInTheDocument();
      expect(container.querySelector('main')).not.toHaveClass('page-shell');
      expect(container.querySelector('.frame')).toHaveClass('frame--bare');
      expect(screen.getByRole('heading', { name: 'Seite' })).toBeInTheDocument();
      await router.navigateByUrl('/dashboard');
      fixture.detectChanges();
      expect(mainNav()).toBeInTheDocument();
    });

    it('keeps the page when the frame changes', async () => {
      const { frame, fixture } = await setup({ frame: 'pending' });
      const page = screen.getByRole('heading', { name: 'Seite' });
      frame.set('rail');
      fixture.detectChanges();
      expect(screen.getByRole('heading', { name: 'Seite' })).toBe(page);
    });

    it('swaps the rail for the bottom bar on a phone, with the account in Mehr', async () => {
      const restore = phoneViewport();
      try {
        const { container, fixture } = await setup();
        expect(container.querySelector('app-nav-rail')).toBeNull();
        expect(container.querySelector('app-bottom-bar')).not.toBeNull();
        expect(container.querySelector('.frame--phone')).not.toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Mehr' }));
        fixture.detectChanges();
        const sheet = screen.getByRole('dialog', { name: 'Mehr' });
        expect(within(sheet).getByText('Konto von Mia')).toBeInTheDocument();
        expect(within(sheet).getByText('Hilfe-Gruppe')).toBeInTheDocument();
      } finally {
        restore();
      }
    });

    it('keeps the foot free for a floating button only on a phone route with `fab`', async () => {
      const restore = phoneViewport();
      try {
        const { router, fixture, container } = await setup();
        const frame = () => container.querySelector('.frame') as HTMLElement;
        expect(frame()).not.toHaveClass('frame--fab');
        await router.navigateByUrl('/start');
        fixture.detectChanges();
        expect(frame()).toHaveClass('frame--fab');
      } finally {
        restore();
      }
    });

    it('gives a `fab` route no clearance outside a phone', async () => {
      const { router, fixture, container } = await setup();
      await router.navigateByUrl('/start');
      fixture.detectChanges();
      expect(container.querySelector('.frame--fab')).toBeNull();
    });

    it('resolves the wide layout from the deepest active route data', async () => {
      const { router, fixture, container } = await setup();
      const main = () => container.querySelector('main') as HTMLElement;
      expect(main()).not.toHaveClass('main--wide');
      await router.navigateByUrl('/budget/wide');
      fixture.detectChanges();
      expect(main()).toHaveClass('main--wide');
    });

    it('keeps the skip link to the main content', async () => {
      await setup();
      expect(screen.getByRole('link', { name: 'Zum Inhalt springen' })).toHaveAttribute(
        'href',
        '#main',
      );
    });

    it('emits search from the rail', async () => {
      const { search } = await setup();
      await userEvent.click(
        within(mainNav() as HTMLElement).getByRole('button', { name: 'Suche' }),
      );
      expect(search).toHaveBeenCalledTimes(1);
    });

    it('carries the marks and the item of the app in the rail', async () => {
      await setup();
      const nav = within(mainNav() as HTMLElement);
      expect(nav.getByRole('link', { name: 'Aufgaben 8 offen' })).toBeInTheDocument();
      expect(nav.getByRole('button', { name: 'Dunkel' })).toBeInTheDocument();
      expect(nav.getByRole('link', { name: 'STUPA, Start' })).toHaveAttribute('href', '/dashboard');
    });

    it('has no search and no Mehr for a small app', async () => {
      const restore = phoneViewport();
      try {
        await setup({ searchable: false, more: false });
        expect(screen.queryByRole('button', { name: 'Mehr' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Suche' })).not.toBeInTheDocument();
      } finally {
        restore();
      }
    });

    it('shows the gate of the app in place of the page while the outlet is off', async () => {
      const { outlet, fixture, container } = await setup();
      outlet.set(false);
      fixture.detectChanges();
      expect(container.querySelector('main')).toHaveTextContent('Offline');
      expect(screen.queryByRole('heading', { name: 'Seite' })).not.toBeInTheDocument();
    });
  });

  describe('footer and fill', () => {
    it('shows the footer of a signed-in page only on a route with `footer`', async () => {
      const { router, fixture } = await setup();
      await router.navigateByUrl('/tasks');
      fixture.detectChanges();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      await router.navigateByUrl('/protocols');
      fixture.detectChanges();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('leaves the footer out while the page fills the viewport', async () => {
      const view = await setup();
      await view.router.navigateByUrl('/protocols');
      view.fixture.detectChanges();
      view.pageFrame.fill.set(true);
      view.fixture.detectChanges();
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      expect(view.container.querySelector('main')).toHaveClass('main--fill');
      view.pageFrame.fill.set(false);
      view.fixture.detectChanges();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('fills the viewport on a route with `fill`', async () => {
      const { router, fixture, container } = await setup();
      await router.navigateByUrl('/board');
      fixture.detectChanges();
      expect(container.querySelector('main')).toHaveClass('main--fill');
      expect(container.querySelector('.frame')).toHaveClass('frame--fill');
      await router.navigateByUrl('/tasks');
      fixture.detectChanges();
      expect(container.querySelector('.frame')).not.toHaveClass('frame--fill');
    });

    it('leaves the footer box empty when the app projects no footer', async () => {
      const { container } = await render(
        `<app-shell frame="public" [nav]="[]" [barKeys]="[]" [brand]="brand" />`,
        {
          imports: [ShellComponent],
          componentProperties: { brand: BRAND },
          providers: [provideRouter(ROUTES)],
        },
      );
      const footer = container.querySelector('.frame__footer');
      expect(footer).not.toBeNull();
      expect(footer?.childNodes).toHaveLength(0);
    });
  });

  it('has no axe violations in the rail frame', async () => {
    const { container } = await setup();
    expect(await runAxe(container)).toHaveNoViolations();
  });
});

/** The shell inside the component of a layout route, as an app with a layout route has it. */
@Component({
  standalone: true,
  imports: [ShellComponent],
  template: `<app-shell frame="rail" [nav]="nav" [barKeys]="barKeys" [brand]="brand" />`,
})
class LayoutPage {
  readonly nav = NAV;
  readonly barKeys = BAR_KEYS;
  readonly brand = BRAND;
}

describe('ShellComponent inside a route component', () => {
  it('renders before the lazy child is active and reads its route data after', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: '',
            component: LayoutPage,
            children: [
              {
                path: 'board',
                loadComponent: () => Promise.resolve(StubPage),
                data: { fill: true },
              },
            ],
          },
        ]),
      ],
    });
    const harness = await RouterTestingHarness.create('/board');
    const host = harness.routeNativeElement as HTMLElement;
    expect(host.querySelector('main')).toHaveClass('main--fill');
    expect(screen.getByRole('heading', { name: 'Seite' })).toBeInTheDocument();
  });
});
