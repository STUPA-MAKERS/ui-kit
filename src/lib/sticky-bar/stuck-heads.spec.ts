import { TestBed } from "@angular/core/testing";
import { StuckHeads } from "./stuck-heads";

describe("StuckHeads (app spec 002406)", () => {
  it("counts the stuck group heads and tab lines and never goes below none", () => {
    const heads = TestBed.inject(StuckHeads);
    expect(heads.groupHead()).toBe(false);
    heads.group(true);
    heads.group(true);
    heads.group(false);
    expect(heads.groupHead()).toBe(true);
    heads.group(false);
    heads.group(false);
    expect(heads.groupHead()).toBe(false);
    heads.group(true);
    expect(heads.groupHead()).toBe(true);
    expect(heads.tabBar()).toBe(false);
    heads.tab(true);
    expect(heads.tabBar()).toBe(true);
    heads.tab(false);
    expect(heads.tabBar()).toBe(false);
  });
});
