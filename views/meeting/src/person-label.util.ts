/** The fields a person label reads. Every API person shape has them, some without `email`. */
export interface PersonLike {
  readonly displayName?: string | null;
  readonly email?: string | null;
}

/** The name, else the e-mail, else the fallback. An empty name or e-mail counts as none. */
export function personLabel(person: PersonLike | null | undefined, fallback: string): string {
  return person?.displayName || person?.email || fallback;
}
