import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every stylesheet of the kit below `dir`. */
function sheets(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "node_modules" ? [] : sheets(path);
    return /\.(scss|css)$/.test(name) ? [path] : [];
  });
}

/** The CSS of a stylesheet without its comments. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("no :has() at the page root (app spec 002406)", () => {
  it("reads a state from a class or an attribute on the element instead", () => {
    const root = join(__dirname, "..", "..");
    const offenders = ["src", "shell", "views", "screens"]
      .flatMap((d) => {
        try {
          return sheets(join(root, d));
        } catch {
          return [];
        }
      })
      .flatMap((file) =>
        (
          withoutComments(readFileSync(file, "utf8")).match(
            /(?<![\w-])(?:body|html|:root)\s*:has\(/g,
          ) ?? []
        ).map((sel) => `${file}: ${sel}`),
      );
    expect(offenders).toEqual([]);
  });
});
