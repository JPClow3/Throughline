import { describe, expect, it } from "vitest";
import { capitalizeFirst } from "../lib/format";

describe("format", () => {
  it("capitalizes the first letter", () => {
    expect(capitalizeFirst("hello")).toBe("Hello");
    expect(capitalizeFirst("")).toBe("");
  });
});
