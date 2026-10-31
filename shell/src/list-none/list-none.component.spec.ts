import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import {
  LIST_NONE_TEXT,
  LIST_PAGE_STATE,
  ListNoneComponent,
  type ListNoneData,
} from './list-none.component';

const NONE: ListNoneData = {
  icon: 'file',
  heading: 'Antrag wählen',
  emptyHeading: 'Keine Anträge',
  emptyBody: 'Noch nichts eingereicht.',
};

function page(loading: boolean, error: boolean, hasRows: boolean) {
  return {
    loading: signal(loading),
    error: signal(error),
    hasRows: signal(hasRows),
    split: signal(true),
  };
}

async function setup(
  state: ReturnType<typeof page> | null,
  data: { none?: ListNoneData } = { none: NONE },
  text?: (t: string) => string,
) {
  return render(ListNoneComponent, {
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { data: of(data), snapshot: { data } },
      },
      ...(state ? [{ provide: LIST_PAGE_STATE, useValue: state }] : []),
      ...(text ? [{ provide: LIST_NONE_TEXT, useValue: text }] : []),
    ],
  });
}

describe('ListNoneComponent', () => {
  it('asks to pick a row when the list has rows', async () => {
    await setup(page(false, false, true));
    expect(screen.getByText('Antrag wählen')).toBeInTheDocument();
  });

  it('says that the list is empty', async () => {
    await setup(page(false, false, false));
    expect(screen.getByText('Keine Anträge')).toBeInTheDocument();
    expect(screen.getByText('Noch nichts eingereicht.')).toBeInTheDocument();
  });

  it('shows only the empty sheet while the list loads, after an error and without a page', async () => {
    for (const state of [page(true, false, true), page(false, true, true), null]) {
      const view = await setup(state);
      expect(screen.queryByText('Antrag wählen')).toBeNull();
      expect(screen.queryByText('Keine Anträge')).toBeNull();
      view.fixture.destroy();
      TestBed.resetTestingModule();
    }
  });

  it('shows nothing without route data', async () => {
    const view = await setup(page(false, false, true), {});
    expect(view.container.querySelector('app-detail-none')).toBeNull();
  });

  it('passes the texts through LIST_NONE_TEXT', async () => {
    await setup(
      page(false, false, false),
      { none: { ...NONE, emptyHeading: 'list.empty' } },
      (t) => `T:${t}`,
    );
    expect(screen.getByText('T:list.empty')).toBeInTheDocument();
    expect(screen.getByText('T:Noch nichts eingereicht.')).toBeInTheDocument();
  });
});
