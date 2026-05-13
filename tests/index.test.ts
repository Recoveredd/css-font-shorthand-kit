import { describe, expect, it } from "vitest";
import {
  formatFontShorthand,
  parseFontFamilyList,
  parseFontShorthand,
  tryParseFontShorthand
} from "../src/index.js";

describe("parseFontShorthand", () => {
  it("parses a nominal shorthand with quoted families", () => {
    const result = parseFontShorthand('italic 700 1rem/1.4 "Inter Tight", system-ui');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      style: "italic",
      weight: "700",
      size: "1rem",
      lineHeight: "1.4",
      family: ["Inter Tight", "system-ui"]
    });
  });

  it("parses line-height separated by whitespace", () => {
    const result = parseFontShorthand("small-caps bold 16px / 20px Arial, sans-serif");

    expect(result.ok).toBe(true);
    if (!result.ok || "system" in result.value) return;
    expect(result.value.variant).toBe("small-caps");
    expect(result.value.weight).toBe("bold");
    expect(result.value.lineHeight).toBe("20px");
    expect(result.value.family).toEqual(["Arial", "sans-serif"]);
  });

  it("returns structured errors for empty input", () => {
    const result = parseFontShorthand("   ");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("empty-input");
  });

  it("returns structured errors when size is missing", () => {
    const result = parseFontShorthand("italic bold Arial");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.code).toBe("missing-font-size");
  });

  it("warns about duplicate and unexpected prefix tokens", () => {
    const result = parseFontShorthand("italic italic sparkle 12px Arial");

    expect(result.ok).toBe(true);
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "duplicate-token",
      "unexpected-token"
    ]);
  });

  it("parses system font keywords when allowed", () => {
    expect(tryParseFontShorthand("menu")).toEqual({ system: "menu" });
  });

  it("can disable system font keywords", () => {
    const result = parseFontShorthand("menu", { allowSystemFonts: false });

    expect(result.ok).toBe(false);
  });
});

describe("parseFontFamilyList", () => {
  it("handles escaped quotes inside quoted families", () => {
    expect(parseFontFamilyList('"A \\"Quoted\\" Face", serif')).toEqual({
      value: ['A "Quoted" Face', "serif"],
      errors: []
    });
  });

  it("rejects empty family entries", () => {
    const result = parseFontFamilyList("Inter,,sans-serif");

    expect(result.errors[0]?.code).toBe("invalid-family");
  });
});

describe("formatFontShorthand", () => {
  it("formats parsed font shorthand values", () => {
    const parsed = tryParseFontShorthand('italic 700 1rem/1.4 "Inter Tight", system-ui');

    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(formatFontShorthand(parsed)).toBe('italic 700 1rem/1.4 "Inter Tight", system-ui');
  });
});
