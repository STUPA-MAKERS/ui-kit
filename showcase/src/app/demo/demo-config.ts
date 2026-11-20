import { signal } from "@angular/core";
import type { Action } from "@stupa-makers/ui-kit";
import type {
  FrameworkConfig,
  SearchHit,
  ShellNavItem,
} from "@stupa-makers/ui-kit/shell";
import { of } from "rxjs";

/** The rows of the demo list, also the hits of the demo search. */
export interface DemoRow {
  readonly id: string;
  readonly title: string;
  readonly sub: string;
  readonly status: string;
  readonly kind: "accent" | "warn" | "neutral";
  readonly amount: string;
  readonly date: string;
}

/** The rows of the demo list, also the hits of the demo search. */
export const DEMO_ROWS: readonly DemoRow[] = [
  {
    id: "1",
    title: "Zuschuss Sommerfest",
    sub: "Fachschaft Informatik",
    status: "In Prüfung",
    kind: "accent",
    amount: "1.200,00 €",
    date: "12.11.2026",
  },
  {
    id: "2",
    title: "Beamer für den Hörsaal",
    sub: "AStA",
    status: "Rückfrage",
    kind: "warn",
    amount: "890,00 €",
    date: "15.11.2026",
  },
  {
    id: "3",
    title: "Exkursion Stuttgart",
    sub: "Fachschaft Technik",
    status: "Bewilligt",
    kind: "neutral",
    amount: "450,00 €",
    date: "18.11.2026",
  },
  {
    id: "4",
    title: "Druck der Erstsemesterhefte",
    sub: "Fachschaft Wirtschaft",
    status: "In Prüfung",
    kind: "accent",
    amount: "640,00 €",
    date: "19.11.2026",
  },
];

const MARK =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0a7"/><path d="M9 21h14M9 11h14M9 16h9" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  );

const NAV: readonly ShellNavItem[] = [
  {
    key: "start",
    path: "/demo/start",
    label: "Start",
    icon: "home",
    place: "main",
  },
  {
    key: "applications",
    path: "/demo/applications",
    label: "Anträge",
    icon: "file",
    place: "main",
  },
  {
    key: "about",
    path: "/demo/about",
    label: "Über",
    icon: "info",
    place: "end",
  },
];

/** The session of the demo: "Anmelden" and "Abmelden" switch the frame. */
export const demoFrame = signal<"rail" | "public">("rail");
const language = signal("de");

/** The config of the demo app: every field and every port set. §S/framework/shell/002260 */
export function demoConfig(): FrameworkConfig {
  const signIn: Action = { key: "signIn", label: "Anmelden" };
  return {
    brand: { name: "Demo", home: "/demo/start", mark: MARK, wordmark: MARK },
    nav: signal(NAV),
    bar: signal(["start", "applications"]),
    account: {
      items: signal([
        {
          key: "profile",
          label: "Profil",
          icon: "user",
          route: { commands: ["/demo/start"] },
        },
      ]),
    },
    publicHead: { actions: signal([signIn]) },
    help: {
      items: signal([
        { key: "wiki", label: "Handbuch", href: "https://wiki.example.org" },
        { key: "report", label: "Problem melden", icon: "alert" },
      ]),
    },
    footer: { links: [{ label: "Über", link: { commands: ["/demo/about"] } }] },
    a11yStatement: { commands: ["/demo/about"] },
    reportBarrier: true,
    languages: [
      { value: "de", label: "Deutsch" },
      { value: "en", label: "English" },
    ],
    language: { current: language, set: (value) => language.set(value) },
    theme: { storageKey: "showcase.theme" },
    ports: {
      session: {
        frame: demoFrame,
        person: signal({ name: "Ada Lovelace" }),
        logout: () => demoFrame.set("public"),
      },
      search: (q) =>
        of(
          DEMO_ROWS.filter((r) =>
            r.title.toLowerCase().includes(q.toLowerCase()),
          ).map(
            (r): SearchHit => ({
              kind: "Anträge",
              title: r.title,
              sub: r.sub,
              icon: "file",
              link: { commands: ["/demo/applications", r.id] },
            }),
          ),
        ),
      navMarks: signal({ applications: "new" }),
    },
  };
}
