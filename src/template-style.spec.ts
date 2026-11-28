import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every template of the kit below `dir`. */
function templates(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "node_modules" ? [] : templates(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

describe("a template has no comments (app spec 003112)", () => {
  it("keeps only the directives to eslint", () => {
    const root = join(__dirname, "..");
    const offenders = [
      "src",
      "shell",
      "views",
      "screens",
      "markdown-editor",
      "markdown-view",
      "pwa",
    ]
      .flatMap((d) => templates(join(root, d)))
      .filter((path) => /<!--(?!\s*eslint-)/.test(readFileSync(path, "utf8")));
    expect(offenders).toEqual([]);
  });
});
