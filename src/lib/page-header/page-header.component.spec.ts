import { Component, inject } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { ListDetailBarComponent } from '../list-detail/list-detail-bar.component';
import { ListDetailNav } from '../list-detail/list-detail-nav';
import { PageHeaderComponent } from './page-header.component';

/** A page of a one-view layout on a phone: the frame shows the bar, the page has its header. */
@Component({
  standalone: true,
  imports: [ListDetailBarComponent, PageHeaderComponent],
  providers: [ListDetailNav],
  template: `
    <app-list-detail-bar />
    <app-page-header title="Flow editor" meta="Version 24 active">
      <nav crumbs class="crumbs" aria-label="Breadcrumb">Admin</nav>
      <span heading class="st">Valid</span>
      <button actions type="button">More</button>
    </app-page-header>
  `,
})
class OneViewPageComponent {
  readonly nav = inject(ListDetailNav);
  constructor() {
    this.nav.active.set(true);
  }
}

/**
 * The layout flags of the header are not visible in the output of a unit test, so the spec
 * asserts the host classes that the stylesheet reads.
 */
describe('PageHeaderComponent', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const view = await render(PageHeaderComponent, {
      inputs: { title: 'Applications', ...inputs },
    });
    return view.fixture.nativeElement as HTMLElement;
  }

  it('renders the title as the h1 of the page', async () => {
    const { container } = await render(`<main><app-page-header title="Applications" /></main>`, {
      imports: [PageHeaderComponent],
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Applications' })).toBeInTheDocument();
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('carries no layout class by default', async () => {
    const host = await setup();
    expect(host.classList.contains('ph--flush')).toBe(false);
    expect(host.classList.contains('ph--rail')).toBe(false);
    expect(host.classList.contains('ph--pane')).toBe(false);
    expect(host.classList.contains('ph--display')).toBe(false);
  });

  /** The parent spaces its children with a gap, so the margin of the header must go. */
  it('drops its bottom margin when flush', async () => {
    const host = await setup({ flush: true });
    expect(host.classList.contains('ph--flush')).toBe(true);
  });

  /** A rail page centres its main column, so the header takes the same cap. */
  it('takes the content cap when the page is a rail layout', async () => {
    const host = await setup({ rail: true });
    expect(host.classList.contains('ph--rail')).toBe(true);
  });

  it('can be both flush and railed', async () => {
    const host = await setup({ rail: true, flush: true });
    expect(host.classList.contains('ph--rail')).toBe(true);
    expect(host.classList.contains('ph--flush')).toBe(true);
  });

  it('keeps the large title on a phone when display is set', async () => {
    const host = await setup({ display: true });
    expect(host.classList.contains('ph--display')).toBe(true);
  });

  it('shows the meta text in the title block, not in the actions slot', async () => {
    const host = await setup({ meta: '8 open' });
    const meta = host.querySelector('.ph__heading .ph__meta');
    expect(meta?.textContent).toBe('8 open');
    expect(host.querySelector('.ph__actions .ph__meta')).toBeNull();
  });

  it('renders no meta element without a meta text', async () => {
    const host = await setup();
    expect(host.querySelector('.ph__meta')).toBeNull();
  });

  it('shows the subtitle under the title', async () => {
    const host = await setup({ subtitle: 'All applications of this year' });
    expect(host.querySelector('.ph__text .ph__subtitle')?.textContent).toBe('All applications of this year');
  });

  it('puts a status of the heading slot in the title block, beside the title', async () => {
    const { container } = await render(
      `<app-page-header title="Grant"><span heading class="st">Active</span><button actions>Save</button></app-page-header>`,
      { imports: [PageHeaderComponent] },
    );
    const heading = container.querySelector('.ph__heading');
    expect(heading?.querySelector('.st')?.textContent).toBe('Active');
    expect(container.querySelector('.ph__actions')?.textContent).toBe('Save');
  });

  it('shows the crumbs slot above the title bar', async () => {
    const { container } = await render(
      `<app-page-header title="Invoices"><nav crumbs class="crumbs" aria-label="Breadcrumb">Budget</nav></app-page-header>`,
      { imports: [PageHeaderComponent] },
    );
    const crumbs = container.querySelector('app-page-header > .crumbs');
    expect(crumbs?.textContent).toBe('Budget');
    expect(crumbs?.nextElementSibling).toHaveClass('ph__bar');
    expect(container.querySelector('h1.ph__title')?.hasAttribute('id')).toBe(false);
  });

  it('is the header of a list column with `pane`: no crumbs, an h1 with an id', async () => {
    const { container } = await render(
      `<app-page-header title="Applications" [pane]="true" titleId="apps-title"><nav crumbs class="crumbs">Home</nav></app-page-header>`,
      { imports: [PageHeaderComponent] },
    );
    expect(container.querySelector('app-page-header')).toHaveClass('ph--pane');
    expect(container.querySelector('.crumbs')).toBeNull();
    expect(container.querySelector('h1.ph__title')?.id).toBe('apps-title');
  });

  it('renders the title as a paragraph when it is no heading of the page', async () => {
    const host = await setup({ pane: true, titleTag: 'p' });
    expect(host.querySelector('h1')).toBeNull();
    expect(host.querySelector('p.ph__title')?.textContent).toBe('Applications');
  });

  /** The bar shows the title; the header keeps it for screen readers only. */
  it('below the bar of a one-view page hands its actions and its title to the bar and drops the crumbs', async () => {
    const view = await render(OneViewPageComponent);
    view.fixture.detectChanges();
    const action = screen.getByRole('button', { name: 'More' });
    expect(action.closest('.ld__barActions')).not.toBeNull();
    expect(view.container.querySelector('.ph__actions')).toBeNull();
    expect(view.container.querySelector('.crumbs')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Flow editor' })).toHaveClass('sr-only');
    expect(view.fixture.componentInstance.nav.title()).toBe('Flow editor');
  });

  it('below the bar of a one-view page puts the meta and the heading slot on the second line of the bar', async () => {
    const view = await render(OneViewPageComponent);
    view.fixture.detectChanges();
    const sub = view.container.querySelector('.ld__barText .ld__barSub');
    expect(sub?.querySelector('.ph__meta')?.textContent).toBe('Version 24 active');
    expect(sub?.querySelector('.st')?.textContent).toBe('Valid');
    expect(view.container.querySelector('.ph__heading .ph__meta')).toBeNull();
    expect(view.container.querySelector('.ph__heading .st')).toBeNull();
  });
});
