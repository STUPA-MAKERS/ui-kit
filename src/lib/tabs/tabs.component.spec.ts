import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TabsComponent, type TabItem } from './tabs.component';

const TABS: TabItem[] = [
  { id: 'app', label: 'Antrag' },
  { id: 'history', label: 'Verlauf', count: 4 },
  { id: 'comments', label: 'Kommentare', count: 0 },
  { id: 'files', label: 'Anhänge', count: null, disabled: true },
];

@Component({
  standalone: true,
  imports: [TabsComponent],
  template: `
    <app-tabs #t ariaLabel="Antrag" idPrefix="ap" [tabs]="tabs" [(active)]="tab" />
    <section role="tabpanel" [id]="t.panelId(tab())" [attr.aria-labelledby]="t.tabId(tab())">Inhalt</section>
  `,
})
class Host {
  tabs = TABS;
  tab = signal<string | null>('app');
}

describe('TabsComponent', () => {
  it('is a named tab list with the active tab selected', async () => {
    await render(Host);
    expect(screen.getByRole('tablist', { name: 'Antrag' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('shows the count after the label, also a zero, and none without a count', async () => {
    await render(Host);
    expect(screen.getByRole('tab', { name: 'Verlauf 4' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Kommentare 0' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Anhänge' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Antrag' }).querySelector('.tabs__count')).toBeNull();
  });

  it('names a tab with a count with a space before the count', async () => {
    await render(Host);
    expect(screen.getByRole('tab', { name: 'Verlauf 4' })).toHaveAttribute('aria-label', 'Verlauf 4');
    expect(screen.getByRole('tab', { name: 'Kommentare 0' })).toHaveAttribute('aria-label', 'Kommentare 0');
    expect(screen.getByRole('tab', { name: 'Antrag' })).not.toHaveAttribute('aria-label');
  });

  it('links the tabs and the panel', async () => {
    await render(Host);
    const tab = screen.getByRole('tab', { name: 'Antrag' });
    expect(tab).toHaveAttribute('id', 'ap-tab-app');
    expect(tab).toHaveAttribute('aria-controls', 'ap-panel-app');
    expect(screen.getByRole('tabpanel', { name: 'Antrag' })).toHaveAttribute('id', 'ap-panel-app');
  });

  it('selects a tab on click', async () => {
    const { fixture } = await render(Host);
    await userEvent.click(screen.getByRole('tab', { name: 'Verlauf 4' }));
    expect(fixture.componentInstance.tab()).toBe('history');
    expect(screen.getByRole('tab', { name: 'Verlauf 4' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Antrag' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrow keys, skips a disabled tab and wraps', async () => {
    const { fixture } = await render(Host);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.tab()).toBe('history');
    expect(tabs[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.tab()).toBe('comments');
    await userEvent.keyboard('{ArrowRight}');
    expect(fixture.componentInstance.tab()).toBe('app');
    await userEvent.keyboard('{ArrowLeft}');
    expect(fixture.componentInstance.tab()).toBe('comments');
    await userEvent.keyboard('{Home}');
    expect(fixture.componentInstance.tab()).toBe('app');
    await userEvent.keyboard('{End}');
    expect(fixture.componentInstance.tab()).toBe('comments');
    await userEvent.keyboard('x');
    expect(fixture.componentInstance.tab()).toBe('comments');
  });

  it('does not select a disabled tab', async () => {
    const { fixture } = await render(Host);
    const files = screen.getByRole('tab', { name: 'Anhänge' });
    expect(files).toBeDisabled();
    const tabs = fixture.debugElement.children[0].componentInstance as TabsComponent;
    tabs.select(TABS[3]);
    expect(fixture.componentInstance.tab()).toBe('app');
  });

  it('falls back to the first enabled tab without a valid active id', async () => {
    const { fixture } = await render(Host);
    fixture.componentInstance.tab.set('nope');
    fixture.detectChanges();
    expect(screen.getByRole('tab', { name: 'Antrag' })).toHaveAttribute('aria-selected', 'true');
    const tabs = fixture.debugElement.children[0].componentInstance as TabsComponent;
    expect(tabs.tabId(null)).toBe('ap-tab-');
    expect(tabs.panelId(null)).toBe('ap-panel-');
  });

  it('does nothing when every tab is disabled', async () => {
    const all = TABS.map((t) => ({ ...t, disabled: true }));
    const { fixture } = await render(Host, { componentProperties: { tabs: all } });
    const tabs = fixture.debugElement.children[0].componentInstance as TabsComponent;
    tabs.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 0);
    expect(fixture.componentInstance.tab()).toBe('app');
    expect(screen.getAllByRole('tab').every((t) => t.getAttribute('tabindex') === '-1')).toBe(true);
  });
});
