---
id: "002233"
title: Filters, sort and search are FilterDef, SortDef and SearchDef
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-20
implementation: null
scope:
  - src/lib
---

# Filters, sort and search are FilterDef, SortDef and SearchDef

The tool row of a list screen must be given as data:

```ts
interface SearchDef { readonly placeholder: string; readonly param?: string; } // default param 'q'
interface FilterDef {
  readonly key: string;                    // also the URL parameter
  readonly label: string;                  // the chip shows the name, then name and value (000663)
  readonly kind: 'single' | 'multi' | 'date-range' | 'toggle';
  readonly options?: readonly { readonly value: string; readonly label: string; readonly icon?: IconName }[];
  readonly value: string | readonly string[] | null;
  readonly place?: 'chip' | 'sheet';       // 'sheet': in the tune sheet behind the search pill
}
interface SortDef { readonly key: string; readonly label: string; readonly active: boolean; readonly dir: 'asc' | 'desc'; }
```

The screen must keep the search, each filter and the sort in the URL, emit one `query` output with
the whole `ListQuery` after a change, and debounce the search (000191). Each filter chip must have
the one chip look (001892). The search pill must name the count of hits (000661) and the list must
show no "X von Y" counter (000662).

Reason: A filter that is data has the same chip, URL and sheet in every list.

Test: Unit tests of the tool row: URL round trip, debounce and the chip labels.
