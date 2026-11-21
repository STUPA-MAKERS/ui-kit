import { InjectionToken } from '@angular/core';

import type { SelectOption } from '../select/select.component';

/** One option of a tree select; a node with children is a group. §S/framework/forms/002255 */
export interface TreeOption {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly TreeOption[];
}

/** The fields every kind has. §S/framework/forms/002255 */
export interface FieldBase {
  readonly key: string;
  readonly label: string;
  readonly required?: boolean;
  /** The app computes it; a hidden field is not checked and not in the value. */
  readonly visible?: boolean;
  readonly disabled?: boolean;
  /** The language of the label when it is not the language of the page. */
  readonly lang?: string;
  readonly width?: 'full' | 'half';
}

export type TextFieldDef = FieldBase & {
  readonly kind: 'text' | 'textarea' | 'email' | 'url' | 'iban';
  readonly maxLength?: number;
  readonly pattern?: string;
};
export type NumberFieldDef = FieldBase & {
  readonly kind: 'number' | 'money';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly currency?: string;
};
export type DateFieldDef = FieldBase & {
  readonly kind: 'date' | 'date-range' | 'time';
  readonly min?: string;
  readonly max?: string;
  readonly shortcuts?: boolean;
};
export type SelectFieldDef = FieldBase & {
  readonly kind: 'select' | 'multi-select';
  readonly options: readonly SelectOption[];
  readonly search?: boolean;
};
export type TreeSelectFieldDef = FieldBase & {
  readonly kind: 'tree-select';
  readonly tree: readonly TreeOption[];
  readonly leavesOnly?: boolean;
};
export type ToggleFieldDef = FieldBase & { readonly kind: 'checkbox' | 'switch' };
export type FileFieldDef = FieldBase & {
  readonly kind: 'file';
  readonly accept?: string;
  readonly maxBytes?: number;
  readonly multiple?: boolean;
};
export type MarkdownFieldDef = FieldBase & {
  readonly kind: 'markdown';
  readonly tools?: readonly string[];
};
export type RepeatFieldDef = FieldBase & {
  readonly kind: 'repeat';
  readonly fields: readonly FieldDef[];
  readonly min?: number;
  readonly max?: number;
  readonly addLabel: string;
};
export type DisplayFieldDef = FieldBase & { readonly kind: 'display'; readonly text: string };

/** One field of a form, of a fixed kind. §S/framework/forms/002255 */
export type FieldDef =
  | TextFieldDef
  | NumberFieldDef
  | DateFieldDef
  | SelectFieldDef
  | TreeSelectFieldDef
  | ToggleFieldDef
  | FileFieldDef
  | MarkdownFieldDef
  | RepeatFieldDef
  | DisplayFieldDef;

/** One section of a form; a wizard shows each section as a step. §S/framework/forms/002255 */
export interface FormSection {
  readonly key: string;
  readonly label?: string;
  /** Each field emits `commit` when the person leaves it (§S/framework/forms/002256). */
  readonly autosave?: boolean;
  readonly fields: readonly FieldDef[];
}

/** A form, built by `app-form` of `/screens`. §S/framework/forms/002222 */
export interface FormDef {
  readonly sections: readonly FormSection[];
}

/** One uploaded file of a file field. */
export interface UploadedFile {
  readonly url: string;
  readonly name: string;
}

/** The upload port of the app (002260); the framework provides it from `ports.upload`. */
export type UiKitUpload = (file: File) => Promise<UploadedFile>;

/** The upload of a file field; `null` without an upload port. */
export const UI_KIT_UPLOAD = new InjectionToken<UiKitUpload | null>('UI_KIT_UPLOAD', {
  providedIn: 'root',
  factory: () => null,
});
