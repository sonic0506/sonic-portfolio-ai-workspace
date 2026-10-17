import { describe, expect, it } from "vitest";

import { newlyCrossed } from "./scroll-depth";

describe("newlyCrossed", () => {
  it("returns every threshold passed so far", () => {
    expect(newlyCrossed(400, 200, 1000, new Set())).toEqual([25, 50]);
  });

  it("skips thresholds already sent", () => {
    expect(newlyCrossed(800, 200, 1000, new Set([25, 50]))).toEqual([75, 90]);
  });

  it("ignores an empty container", () => {
    expect(newlyCrossed(0, 0, 0, new Set())).toEqual([]);
  });
});
