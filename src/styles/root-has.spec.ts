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

describe("no :has() at the page root reads a state that a scroll changes (app spec 002406)", () => {
  // The classes that a component sets while the page scrolls.
  const scrollStates = [
    "--stuck",
    "--under",
    "--folded",
    "--scrolled",
    "--covered",
  ];

  it("reads them from a class on the element instead", () => {
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
          readFileSync(file, "utf8").match(
            /(?:body|html|:root):has\([^)]*\)/g,
          ) ?? []
        )
          .filter((sel) => scrollStates.some((s) => sel.includes(s)))
          .map((sel) => `${file}: ${sel}`),
      );
    expect(offenders).toEqual([]);
  });
});
