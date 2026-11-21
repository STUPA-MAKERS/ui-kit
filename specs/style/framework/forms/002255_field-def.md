---
id: "002255"
title: A field of a form is a FieldDef of a fixed kind
kind: style
status: approved
owner: frederikbeimgraben
updated: 2026-11-21
implementation:
  - screens/src/form/form.component.ts
scope:
  - src/lib
  - screens
---

# A field of a form is a FieldDef of a fixed kind

A `FormDef` (002222) must have this type:

```ts
interface FormDef { readonly sections: readonly FormSection[]; }
interface FormSection { readonly key: string; readonly label?: string; readonly autosave?: boolean; // 002256
  readonly fields: readonly FieldDef[]; }
type FieldDef =
  | Base & { kind: 'text' | 'textarea' | 'email' | 'url' | 'iban'; maxLength?: number; pattern?: string }
  | Base & { kind: 'number' | 'money'; min?: number; max?: number; step?: number; currency?: string }
  | Base & { kind: 'date' | 'date-range' | 'time'; min?: string; max?: string; shortcuts?: boolean } // 000700
  | Base & { kind: 'select' | 'multi-select'; options: readonly SelectOption[]; search?: boolean }
  | Base & { kind: 'tree-select'; tree: readonly TreeOption[]; leavesOnly?: boolean }         // STUPA-Workflow:001031
  | Base & { kind: 'checkbox' | 'switch' }
  | Base & { kind: 'file'; accept?: string; maxBytes?: number; multiple?: boolean }             // through the upload port
  | Base & { kind: 'markdown'; tools?: readonly string[] }
  | Base & { kind: 'repeat'; fields: readonly FieldDef[]; min?: number; max?: number; addLabel: string }
  | Base & { kind: 'display'; text: string };
interface TreeOption { readonly value: string; readonly label: string; readonly children?: readonly TreeOption[]; }
interface Base { readonly key: string; readonly label: string; readonly required?: boolean;
  readonly visible?: boolean; readonly disabled?: boolean; readonly lang?: string; readonly width?: 'full' | 'half'; }
```

The types are in core; `app-form` is in `/screens`, because a Markdown field needs `/markdown-editor`
(002215). A multi-select is a group of check boxes under its label, and a tree select is a select
with the options indented by depth. A file field uploads through the upload port of the app (002260)
and keeps `{ url, name }` for each file.

The kit must show the label above each field, a form error as a text next to the field (000519),
no helper text (000206), and a required mark that is not colour alone (000502). A button beside a
field must be as high as the field (001910).

Reason: A fixed set of field kinds keeps every field the same in every form.

Test: Unit tests of `app-form` for each kind, and the jest-axe test.
