import { InjectionToken } from '@angular/core';
import type { KnownName } from '@stupa-makers/ui-kit';
import type { Uuid } from './protocol.types';

/** An image file with the alternative text that the person gave for it. */
export interface ProtocolImageAlt {
  readonly file: File;
  readonly alt: string;
}

/** An uploaded PDF of a protocol: its name and its path, the `src` of its badge. */
export interface ProtocolDocument {
  readonly name: string;
  readonly src: string;
}

/**
 * The server calls of the TOP sheet. The app provides it over its API client, so the view
 * knows no route.
 *
 * - `imageAlts` asks for the alternative text of each image (app spec 000506) and resolves to
 *   the files that the person did not cancel.
 * - `uploadImage` uploads one image and resolves to its path; `uploadDocument` uploads one PDF to
 *   the protocol of the meeting (000862). Both show their own error and then reject.
 * - `documentInfo` resolves to the page count of a PDF badge, or null.
 * - `knownNames` gives the known names of the meeting for the automatic blackout (000969); the
 *   list may load at the first call and be empty until it is there.
 *
 * Without the port the sheet uploads nothing and marks no names.
 */
export interface ProtocolApi {
  imageAlts(files: readonly File[]): Promise<readonly ProtocolImageAlt[]>;
  uploadImage(file: File): Promise<string>;
  uploadDocument(meetingId: Uuid, file: File): Promise<ProtocolDocument>;
  documentInfo(src: string): Promise<number | null>;
  knownNames(meetingId: Uuid): readonly KnownName[];
}

export const PROTOCOL_API = new InjectionToken<ProtocolApi>('PROTOCOL_API');

/** The image types that the media upload accepts. SVG is never one of them. */
export const PROTOCOL_IMAGE_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/** The document types that the media upload accepts. */
export const PROTOCOL_DOCUMENT_TYPES: readonly string[] = ['application/pdf'];

/** The Markdown reference of an uploaded image. */
export function protocolImage(alt: string, src: string): string {
  const clean = alt
    .replace(/[[\]\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `![${clean}](${src})`;
}

/** The Markdown reference of an uploaded PDF. */
export function protocolDocument(name: string, src: string): string {
  const clean = name.replace(/\s+/g, ' ').trim().replace(/[\\[\]]/g, '\\$&') || 'PDF';
  return `[${clean}](${src})`;
}
