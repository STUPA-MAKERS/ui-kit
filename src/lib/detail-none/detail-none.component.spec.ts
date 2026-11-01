import { render, screen } from '@testing-library/angular';
import { runAxe } from '../../../testing/a11y';
import { DetailNoneComponent } from './detail-none.component';

describe('DetailNoneComponent', () => {
  it('asks to pick a row, on the sheet of an open row', async () => {
    const { container } = await render(
      `<app-detail-none icon="vote" heading="Pick a vote." body="It opens here." />`,
      { imports: [DetailNoneComponent] },
    );
    expect(screen.getByText('Pick a vote.')).toBeInTheDocument();
    expect(screen.getByText('It opens here.')).toBeInTheDocument();
    const host = container.querySelector('app-detail-none');
    expect(host).toHaveClass('dn--sheet');
    expect(host).toHaveClass('dn--inset');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('shows the text of an empty list with its own icon', async () => {
    const { container } = await render(
      `<app-detail-none state="empty" icon="tasks" emptyIcon="check" heading="Pick" emptyHeading="No tasks" emptyBody="All done." />`,
      { imports: [DetailNoneComponent] },
    );
    expect(screen.getByText('No tasks')).toBeInTheDocument();
    expect(screen.getByText('All done.')).toBeInTheDocument();
    expect(screen.queryByText('Pick')).toBeNull();
    expect(container.querySelector('app-empty-state')).toBeTruthy();
  });

  it('shows nothing while the list loads', async () => {
    const { container } = await render(`<app-detail-none state="busy" heading="Pick" />`, {
      imports: [DetailNoneComponent],
    });
    expect(container.querySelector('app-empty-state')).toBeNull();
    expect(container.querySelector('app-detail-none')).toHaveClass('dn--sheet');
  });

  it('has no sheet when flat, and no padding without inset', async () => {
    const { container } = await render(
      `<app-detail-none surface="flat" heading="a" /><app-detail-none [inset]="false" heading="b" />`,
      { imports: [DetailNoneComponent] },
    );
    const [flat, bare] = Array.from(container.querySelectorAll('app-detail-none'));
    expect(flat).not.toHaveClass('dn--sheet');
    expect(bare).toHaveClass('dn--sheet');
    expect(bare).not.toHaveClass('dn--inset');
  });

  it('shows hidden bars in the shape of a sheet as a ghost', async () => {
    const { container } = await render(`<app-detail-none [ghost]="true" heading="x" />`, {
      imports: [DetailNoneComponent],
    });
    expect(container.querySelector('.dn__ghost')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.dn__bar--card')).toHaveLength(2);
    expect(screen.queryByText('x')).toBeNull();
  });
});
