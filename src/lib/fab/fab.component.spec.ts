import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { runAxe } from '../../../testing/a11y';
import { matchOnly } from '../../../testing/media';
import { MEDIA } from '../breakpoints/breakpoints';
import { FabGroupComponent } from './fab-group.component';
import { FabComponent } from './fab.component';

async function setup(template: string, props: Record<string, unknown> = {}) {
  return render(template, {
    imports: [FabComponent],
    componentProperties: props,
  });
}

describe('FabComponent', () => {
  it('is one fab button with the plus icon and its label as the name', async () => {
    const { container } = await setup(`<app-fab label="New committee" />`);
    const button = screen.getByRole('button', { name: 'New committee' });
    expect(button).toHaveClass('btn--fab');
    expect(button).toHaveTextContent('New committee');
    expect(container.querySelector('app-icon')).toBeTruthy();
    expect(container.querySelector('app-fab')).toHaveClass('fab');
    expect(container.querySelector('app-fab')).not.toHaveClass('fab--contained');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('emits activate on a click and from the keyboard', async () => {
    const activate = jest.fn();
    await setup(`<app-fab label="New deadline" (activate)="activate()" />`, {
      activate,
    });
    await userEvent.click(screen.getByRole('button', { name: 'New deadline' }));
    expect(activate).toHaveBeenCalledTimes(1);
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'New deadline' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(activate).toHaveBeenCalledTimes(2);
  });

  it('takes the focus back when the page shows it again after its form', async () => {
    const view = await setup(`@if (!formOpen) { <app-fab label="New booking" (activate)="formOpen = true" /> } <button>Other</button>`, {
      formOpen: false,
    });
    await userEvent.click(screen.getByRole('button', { name: 'New booking' }));
    view.fixture.detectChanges();
    expect(screen.queryByRole('button', { name: 'New booking' })).toBeNull();
    view.fixture.componentInstance.formOpen = false;
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(screen.getByRole('button', { name: 'New booking' })).toHaveFocus();
  });

  it('takes no focus when it was not pressed, or when something else has the focus', async () => {
    const view = await setup(`@if (!formOpen) { <app-fab label="New booking" /> } <button>Other</button>`, {
      formOpen: false,
    });
    view.fixture.componentInstance.formOpen = true;
    view.fixture.detectChanges();
    view.fixture.componentInstance.formOpen = false;
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(screen.getByRole('button', { name: 'New booking' })).not.toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'New booking' }));
    view.fixture.componentInstance.formOpen = true;
    view.fixture.detectChanges();
    screen.getByRole('button', { name: 'Other' }).focus();
    view.fixture.componentInstance.formOpen = false;
    view.fixture.detectChanges();
    await view.fixture.whenStable();
    expect(screen.getByRole('button', { name: 'Other' })).toHaveFocus();
  });

  it('marks the contained mode on the host', async () => {
    const { container } = await setup(`<app-fab label="New meeting" [contained]="true" />`);
    expect(container.querySelector('app-fab')).toHaveClass('fab--contained');
  });

  it('is the save action with the check icon, and takes no click while it saves or is disabled', async () => {
    const activate = jest.fn();
    const { rerender } = await setup(
      `<app-fab icon="check" label="Save" [loading]="loading" [disabled]="disabled" (activate)="activate()" />`,
      { activate, loading: true, disabled: false },
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    await rerender({
      componentProperties: { activate, loading: false, disabled: true },
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await rerender({
      componentProperties: { activate, loading: false, disabled: false },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(activate).toHaveBeenCalledTimes(1);
  });
});

describe('FabComponent icon only and FabGroupComponent', () => {
  it('is a round icon button with the label as its name and title', async () => {
    const { container } = await render(`<app-fab icon="check" label="Save" [iconOnly]="true" />`, {
      imports: [FabComponent],
    });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('btn--fab');
    expect(button).toHaveClass('btn--icon');
    expect(button).toHaveAttribute('title', 'Save');
    expect(button).not.toHaveTextContent('Save');
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('keeps the labelled pill without a title by default', async () => {
    await render(`<app-fab label="New meeting" />`, {
      imports: [FabComponent],
    });
    const button = screen.getByRole('button', { name: 'New meeting' });
    expect(button).not.toHaveClass('btn--icon');
    expect(button).not.toHaveAttribute('title');
  });

  it('puts a contained group at the end of its pane', async () => {
    await render(
      `<app-fab-group [contained]="true">
        <app-fab label="Antrag stellen" tone="neutral" />
        <app-fab label="Antrag erfassen" />
      </app-fab-group>`,
      { imports: [FabComponent, FabGroupComponent] },
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('fab-group--contained');
    expect(group.querySelectorAll('.fab--contained')).toHaveLength(0);
  });

  it('puts several fabs side by side in a group, which takes the position', async () => {
    const reset = jest.fn();
    const save = jest.fn();
    const { container } = await render(
      `<app-fab-group>
        <app-fab icon="reset" label="Reset" [iconOnly]="true" tone="neutral" (activate)="reset()" />
        <app-fab icon="check" label="Save" [iconOnly]="true" (activate)="save()" />
      </app-fab-group>`,
      {
        imports: [FabComponent, FabGroupComponent],
        componentProperties: { reset, save },
      },
    );
    const group = screen.getByRole('group');
    const fabs = Array.from(group.querySelectorAll('app-fab'));
    expect(fabs).toHaveLength(2);
    expect(fabs.every((f) => f.classList.contains('fab--grouped'))).toBe(true);
    expect(fabs[0]).toHaveClass('fab--neutral');
    expect(fabs[1]).not.toHaveClass('fab--neutral');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(await runAxe(container)).toHaveNoViolations();
  });

  it('is not grouped on its own', async () => {
    const { container } = await render(`<app-fab label="New" />`, {
      imports: [FabComponent],
    });
    expect(container.querySelector('app-fab')).not.toHaveClass('fab--grouped');
  });
});

describe('FabComponent folds on a phone (spec 000567)', () => {
  let restore: () => void;
  afterEach(() => restore());

  /** A scroll area of 100px with 400px of content, scrolled to `top`. */
  function scroll(area: HTMLElement, top: number, scrollHeight = 400): void {
    Object.defineProperty(area, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(area, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(area, 'scrollTop', { value: top, configurable: true });
    area.dispatchEvent(new Event('scroll'));
  }

  async function phoneFab(template = `<div class="area"></div><app-fab label="Antrag erfassen" />`) {
    const view = await setup(template);
    return {
      view,
      fab: view.container.querySelector('app-fab') as HTMLElement,
      area: view.container.querySelector('.area') as HTMLElement,
    };
  }

  it('folds while the page is scrolled down and unfolds at the top, with the label as name', async () => {
    restore = matchOnly(MEDIA.phone);
    const { view, fab, area } = await phoneFab();
    expect(fab).not.toHaveClass('fab--folded');
    expect(fab.querySelector('.fab__label')).toHaveTextContent('Antrag erfassen');
    scroll(area, 200);
    view.fixture.detectChanges();
    expect(fab).toHaveClass('fab--folded');
    expect(screen.getByRole('button', { name: 'Antrag erfassen' })).toBeTruthy();
    scroll(area, 0);
    view.fixture.detectChanges();
    expect(fab).not.toHaveClass('fab--folded');
  });

  it('ignores a row that scrolls only sideways', async () => {
    restore = matchOnly(MEDIA.phone);
    const { view, fab, area } = await phoneFab();
    scroll(area, 200);
    view.fixture.detectChanges();
    const row = document.createElement('div');
    view.container.appendChild(row);
    scroll(row, 0, 100);
    view.fixture.detectChanges();
    expect(fab).toHaveClass('fab--folded');
  });

  it('does not fold on a wide screen', async () => {
    restore = matchOnly(MEDIA.notPhone);
    const { view, fab, area } = await phoneFab();
    scroll(area, 200);
    view.fixture.detectChanges();
    expect(fab).not.toHaveClass('fab--folded');
  });

  it('does not fold as an icon button', async () => {
    restore = matchOnly(MEDIA.phone);
    const round = await phoneFab(`<div class="area"></div><app-fab label="Neu" [iconOnly]="true" />`);
    scroll(round.area, 200);
    round.view.fixture.detectChanges();
    expect(round.fab).not.toHaveClass('fab--folded');
    expect(round.fab.querySelector('.fab__label')).toBeNull();
  });
});

describe('FabComponent fold moves no layout (app spec 002407)', () => {
  const realRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  const realAnimate = Element.prototype.animate;
  let restore: () => void;
  let anims: { el: Element; keyframes: Keyframe[]; anim: Animation & { reversed: number } }[];

  beforeEach(() => {
    anims = [];
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      constructor(private readonly cb: (entries: { target: Element }[]) => void) {}
      observe(target: Element): void {
        this.cb([{ target }]);
      }
      disconnect(): void {
        /* nothing to stop */
      }
    };
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null) {
      const state = { reversed: 0, onfinish: null as (() => void) | null, cancel: jest.fn() };
      const anim = Object.assign(state, {
        reverse: () => {
          state.reversed += 1;
        },
        addEventListener: (_type: string, fn: () => void) => {
          state.onfinish = fn;
        },
      }) as unknown as Animation & { reversed: number };
      anims.push({ el: this, keyframes: keyframes as Keyframe[], anim });
      return anim;
    };
    jest.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          borderTopLeftRadius: '16px',
          getPropertyValue: (name: string) => (name === '--motion-base' ? '200ms' : 'ease'),
        }) as unknown as CSSStyleDeclaration,
    );
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const rect = (left: number, width: number) =>
        ({ left, width, height: 56, top: 0, right: left + width, bottom: 56, x: left, y: 0 }) as DOMRect;
      if (this.tagName === 'BUTTON') return rect(0, 193);
      if (this.tagName === 'APP-ICON') return rect(17, 20);
      return rect(0, 0);
    });
  });
  afterEach(() => {
    restore();
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = realRO;
    Element.prototype.animate = realAnimate;
    jest.restoreAllMocks();
  });

  function scroll(area: HTMLElement, top: number): void {
    Object.defineProperty(area, 'scrollHeight', { value: 400, configurable: true });
    Object.defineProperty(area, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(area, 'scrollTop', { value: top, configurable: true });
    area.dispatchEvent(new Event('scroll'));
  }

  const finish = (): void => {
    (anims[0].anim as unknown as { onfinish: () => void }).onfinish();
  };

  const template = `<div class="area"></div>
    <app-fab-group>
      <app-fab label="Antrag stellen" icon="form" [iconOnly]="true" tone="neutral" />
      <app-fab label="Antrag erfassen" icon="fileplus" />
    </app-fab-group>`;

  it('clips, slides and fades, and takes the folded size only at the end', async () => {
    restore = matchOnly(MEDIA.phone);
    const view = await render(template, { imports: [FabComponent, FabGroupComponent] });
    await view.fixture.whenStable();
    const [neutral, fab] = Array.from(view.container.querySelectorAll('app-fab')) as HTMLElement[];
    scroll(view.container.querySelector('.area') as HTMLElement, 200);
    view.fixture.detectChanges();
    expect(fab).not.toHaveClass('fab--folded');
    const props = anims.flatMap((a) => Object.keys(a.keyframes[1]).filter((k) => k !== 'offset'));
    expect(props.sort()).toEqual(['clipPath', 'opacity', 'transform', 'transform']);
    expect(anims.find((a) => a.el === neutral)?.keyframes[1]).toEqual({ transform: 'translateX(137px)' });
    finish();
    expect(fab).toHaveClass('fab--folded');
    anims.forEach((a) => expect(a.anim.cancel).toHaveBeenCalled());
  });

  it('turns a running fold round when the page is back at the top', async () => {
    restore = matchOnly(MEDIA.phone);
    const view = await render(template, { imports: [FabComponent, FabGroupComponent] });
    await view.fixture.whenStable();
    const fab = view.container.querySelectorAll('app-fab')[1] as HTMLElement;
    const area = view.container.querySelector('.area') as HTMLElement;
    scroll(area, 200);
    view.fixture.detectChanges();
    scroll(area, 0);
    view.fixture.detectChanges();
    expect(anims.every((a) => a.anim.reversed === 1)).toBe(true);
    finish();
    expect(fab).not.toHaveClass('fab--folded');
  });

  it('folds at once with reduced motion', async () => {
    restore = matchOnly(MEDIA.phone);
    document.documentElement.setAttribute('data-display-motion', 'reduce');
    try {
      const view = await render(template, { imports: [FabComponent, FabGroupComponent] });
      await view.fixture.whenStable();
      scroll(view.container.querySelector('.area') as HTMLElement, 200);
      view.fixture.detectChanges();
      expect(view.container.querySelectorAll('app-fab')[1]).toHaveClass('fab--folded');
      expect(anims).toHaveLength(0);
    } finally {
      document.documentElement.removeAttribute('data-display-motion');
    }
  });
});
