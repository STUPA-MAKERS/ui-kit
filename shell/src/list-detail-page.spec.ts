import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { type ListDetailLayoutComponent, PageFrame } from '@stupa-makers/ui-kit';
import { type ListDetailPage, injectListDetailPage } from './list-detail-page';

const collapsed = signal(true);
const layout = signal({ collapsed } as unknown as ListDetailLayoutComponent);
let pageState: ListDetailPage;
let tokenState: ListDetailPage;

@Component({ standalone: true, template: '' })
class Child {}

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class ListPage {
  constructor() {
    pageState = injectListDetailPage(layout);
  }
}

@Component({ standalone: true, template: '' })
class TokenPage {
  constructor() {
    tokenState = injectListDetailPage(layout, { param: 'token' });
  }
}

@Component({ standalone: true, template: '' })
class Other {}

describe('injectListDetailPage', () => {
  beforeEach(() => {
    collapsed.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'list',
            component: ListPage,
            children: [
              { path: '', component: Child },
              { path: ':id', component: Child },
            ],
          },
          {
            path: 'tokens',
            component: TokenPage,
            children: [{ path: ':token', component: Child }],
          },
          { path: 'other', component: Other },
        ]),
      ],
    });
  });

  it('reads the id of the open child route after each navigation', async () => {
    const harness = await RouterTestingHarness.create('/list');
    expect(pageState.selectedId()).toBeNull();
    await harness.navigateByUrl('/list/42');
    expect(pageState.selectedId()).toBe('42');
    await harness.navigateByUrl('/list');
    expect(pageState.selectedId()).toBeNull();
  });

  it('reads a custom parameter', async () => {
    await RouterTestingHarness.create('/tokens/abc');
    expect(tokenState.selectedId()).toBe('abc');
  });

  it('sets fill while the panes sit side by side and clears it when the page goes', async () => {
    const harness = await RouterTestingHarness.create('/list');
    const frame = TestBed.inject(PageFrame);
    expect(pageState.split()).toBe(false);
    expect(frame.fill()).toBe(false);
    collapsed.set(false);
    harness.detectChanges();
    expect(pageState.split()).toBe(true);
    expect(frame.fill()).toBe(true);
    await TestBed.inject(Router).navigateByUrl('/other');
    harness.detectChanges();
    expect(frame.fill()).toBe(false);
  });
});
