import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render } from '@testing-library/angular';

import { runAxe } from '../../../testing/a11y';
import { ColumnsComponent } from './columns.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [ColumnsComponent],
  template: `
    <app-columns>
      <ng-container ngProjectAs="[main]"><p>Regel</p></ng-container>
      <ng-container ngProjectAs="[side]"><p>Verweise</p></ng-container>
    </app-columns>
  `,
})
class Host {}

// §S/framework/screens/002797
describe('ColumnsComponent', () => {
  it('puts each slot in its column', async () => {
    const view = await render(Host);
    expect(view.container.querySelector('.cols__col--main')?.textContent).toBe('Regel');
    expect(view.container.querySelector('.cols__col--side')?.textContent).toBe('Verweise');
    expect(await runAxe(view.container)).toHaveNoViolations();
  });
});
