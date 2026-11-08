import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TabsComponent, type TabItem } from './tabs.component';

const TABS: TabItem[] = [
  { id: 'app', label: 'Antrag' },
  { id: 'history', label: 'Verlauf' },
  { id: 'comments', label: 'Kommentare' },
  { id: 'files', label: 'Anhänge', disabled: true },
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

  /** App spec 000560: a tab shows its label and no count. WCAG 2.5.3: the name is the visible text. */
  it('names a tab only by its label, with no count and no aria-label', async () => {
    await render(Host);
    for (const name of ['Antrag', 'Verlauf', 'Kommentare', 'Anhänge']) {
      const tab = screen.getByRole('tab', { name });
      expect(tab).not.toHaveAttribute('aria-label');
      expect(tab.textContent?.trim()).toBe(name);
    }
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
    await userEvent.click(screen.getByRole('tab', { name: 'Verlauf' }));
    expect(fixture.componentInstance.tab()).toBe('history');
    expect(screen.getByRole('tab', { name: 'Verlauf' })).toHaveAttribute('tabindex', '0');
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
