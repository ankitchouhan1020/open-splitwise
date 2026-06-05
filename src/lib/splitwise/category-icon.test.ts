import { describe, expect, it } from "vitest";
import {
  categoryIconFromRaw,
  splitwiseColorToCss,
} from "@/lib/splitwise/category-icon";

describe("categoryIconFromRaw", () => {
  it("extracts square icon and background from Splitwise category", () => {
    const style = categoryIconFromRaw({
      id: 48,
      name: "Cleaning",
      icon: "https://example.com/icon.png",
      icon_types: {
        transparent: {
          large: "https://example.com/transparent@2x.png",
        },
        square: {
          large: "https://example.com/square@2x.png",
        },
      },
      colors: {
        background: { light: "#1445a0ce" },
        light: "#c8e8f1",
      },
    });

    expect(style?.iconUrl).toBe("https://example.com/transparent@2x.png");
    expect(style?.backgroundColor).toBe("#c8e8f1");
    expect(style?.fullBleed).toBe(false);
  });
});

describe("splitwiseColorToCss", () => {
  it("converts 8-digit hex to rgba", () => {
    expect(splitwiseColorToCss("#1445a0ce")).toBe("rgba(20, 69, 160, 0.808)");
  });

  it("passes through normal colors", () => {
    expect(splitwiseColorToCss("#c8e8f1")).toBe("#c8e8f1");
  });
});
