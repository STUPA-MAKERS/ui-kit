import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  placeActions,
  type Action,
  type HeadSlots,
} from "@stupa-makers/ui-kit";

const WIDTHS = ["phone", "narrow", "wide"] as const;

const ACTIONS: readonly Action[] = [
  { key: "create", label: "Antrag erfassen", kind: "main", priority: "fab" },
  { key: "export", label: "Exportieren", kind: "normal", priority: "head" },
  { key: "filter", label: "Filter", kind: "normal", priority: "head" },
  { key: "archive", label: "Archivieren", kind: "normal", priority: "menu" },
  { key: "delete", label: "Löschen", kind: "danger", priority: "menu" },
];

const CASES: readonly { readonly title: string; readonly slots: HeadSlots }[] =
  [
    { title: "Standard", slots: {} },
    { title: "headSlots: Telefon 2, schmal 1", slots: { phone: 2, narrow: 1 } },
  ];

/** Shows where the kit places the same actions in each width (spec 002231). */
@Component({
  selector: "sc-actions-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of cases; track item.title) {
      <h2>{{ item.title }}</h2>
      <table>
        <thead>
          <tr>
            <th>Breite</th>
            <th>Kopf</th>
            <th>⋮</th>
            <th>FAB</th>
          </tr>
        </thead>
        <tbody>
          @for (row of item.rows; track row.width) {
            <tr>
              <th>{{ row.width }}</th>
              <td>{{ row.head }}</td>
              <td>{{ row.menu }}</td>
              <td>{{ row.fab }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    table {
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th,
    td {
      padding: 6px 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border, currentColor);
    }
  `,
})
export class ActionsPage {
  protected readonly cases = CASES.map((item) => ({
    title: item.title,
    rows: WIDTHS.map((width) => {
      const placed = placeActions(ACTIONS, width, item.slots);
      const names = (list: readonly Action[]): string =>
        list.map((a) => a.label).join(", ") || "–";
      return {
        width,
        head: names(placed.head),
        menu: names(placed.menu),
        fab: names(placed.fab),
      };
    }),
  }));
}
