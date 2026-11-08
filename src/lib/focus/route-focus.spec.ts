import {
  type AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import { RouteFocus } from './route-focus';

@Component({ standalone: true, template: '<h1>Seite A</h1><a href="/b">Weiter</a>' })
class PageA {}

@Component({ standalone: true, template: '<h1>Seite B</h1>' })
class PageB {}

@Component({ standalone: true, template: '<p>Ohne Überschrift</p>' })
class PageNone {}

/** Shows its heading only after its "data" arrived. */
@Component({
  standalone: true,
  template: `@if (ready()) {
    <h1>Spät</h1>
  } @else {
    <p>Lädt</p>
  }`,
})
class PageLate {
  readonly ready = signal(false);
  constructor() {
    setTimeout(() => this.ready.set(true), 30);
  }
}

@Component({ standalone: true, template: '<h1>Formular</h1><input aria-label="Name" #field />' })
class PageAutofocus implements AfterViewInit {
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  ngAfterViewInit(): void {
    this.field().nativeElement.focus();
  }
}

/** A list page whose detail pane is the scope of the focus. */
@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `<h1>Liste</h1>
    <section #detail aria-label="Detail"><router-outlet /></section>`,
})
class PageList {
  private readonly detail = viewChild.required<ElementRef<HTMLElement>>('detail');
  private readonly router = inject(Router);
  constructor() {
    const focus = inject(RouteFocus);
    const scope = (): HTMLElement | null =>
      this.router.url.includes('/list/') ? this.detail().nativeElement : null;
    focus.setScope(scope);
    inject(DestroyRef).onDestroy(() => focus.releaseScope(scope));
  }
}

@Component({ standalone: true, template: '<h2>Eintrag 1</h2>' })
class PageItem {}

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `<main #main tabindex="-1"><router-outlet /></main>`,
})
class Host {
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');
  constructor() {
    inject(RouteFocus).start(() => this.main()?.nativeElement);
  }
}

async function setup() {
  const view = await render(Host, {
    providers: [
      provideRouter([
        { path: 'a', component: PageA },
        { path: 'b', component: PageB },
        { path: 'none', component: PageNone },
        { path: 'late', component: PageLate },
        { path: 'quiet', component: PageB, data: { routeFocus: false } },
        { path: 'auto', component: PageAutofocus },
        { path: 'list', component: PageList, children: [{ path: ':id', component: PageItem }] },
      ]),
    ],
  });
  const injector = view.fixture.debugElement.injector;
  const router = injector.get(Router);
  const go = async (url: string): Promise<void> => {
    await router.navigateByUrl(url);
    view.fixture.detectChanges();
  };
  await go('/a');
  return { ...view, router, go, focus: injector.get(RouteFocus) };
}

/** Waits a few frames, so a focus that would come has come. */
async function frames(): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
}

describe('RouteFocus', () => {
  beforeEach(() => {
    // jsdom lays nothing out; every element that is not hidden has a box.
    jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
      return (this.closest('[hidden]') ? [] : [{}]) as unknown as DOMRectList;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('leaves the focus alone on the first page', async () => {
    await setup();
    await frames();
    expect(document.body).toHaveFocus();
  });

  it('focuses the h1 of the new page without a scroll, and makes it focusable', async () => {
    const { go } = await setup();
    screen.getByRole('link', { name: 'Weiter' }).focus();
    await go('/b');
    const heading = screen.getByRole('heading', { name: 'Seite B' });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('waits for the heading of a page that loads its data', async () => {
    const { go } = await setup();
    await go('/late');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Spät' })).toHaveFocus());
  });

  it('focuses main when no heading shows in time', async () => {
    const { go } = await setup();
    const now = Date.now();
    await go('/none');
    jest.spyOn(Date, 'now').mockReturnValue(now + 10_000);
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('keeps the focus when only the query changes', async () => {
    const { go } = await setup();
    const link = screen.getByRole('link', { name: 'Weiter' });
    link.focus();
    await go('/a?filter=open');
    await frames();
    expect(link).toHaveFocus();
  });

  it('keeps the focus on a route with `routeFocus: false`', async () => {
    const { go } = await setup();
    await go('/quiet');
    await frames();
    expect(screen.getByRole('heading', { name: 'Seite B' })).not.toHaveFocus();
  });

  it('keeps a focus that the page moved itself', async () => {
    const { go } = await setup();
    await go('/auto');
    await frames();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus();
  });

  it('keeps the focus when a component holds it for the navigation', async () => {
    const { go, router, focus, fixture } = await setup();
    const done = router.navigateByUrl('/b');
    focus.hold();
    await done;
    fixture.detectChanges();
    await frames();
    expect(screen.getByRole('heading', { name: 'Seite B' })).not.toHaveFocus();
    await go('/a');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seite A' })).toHaveFocus());
  });

  it('focuses the heading of the scope while it is set, else the page', async () => {
    const { go } = await setup();
    await go('/list/1');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Eintrag 1' })).toHaveFocus());
    await go('/list');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Liste' })).toHaveFocus());
    await go('/b');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seite B' })).toHaveFocus());
  });

  it('releases only its own scope', async () => {
    const { focus } = await setup();
    const scopeOf = (): unknown => (focus as unknown as { scopeFn: unknown }).scopeFn;
    const mine = (): HTMLElement | null => null;
    focus.setScope(mine);
    focus.releaseScope(() => null);
    expect(scopeOf()).toBe(mine);
    focus.releaseScope(mine);
    expect(scopeOf()).toBeNull();
  });

  it('starts once', async () => {
    const { focus, go } = await setup();
    focus.start(() => undefined);
    await go('/b');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Seite B' })).toHaveFocus());
  });
});
