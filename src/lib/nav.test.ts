import { describe, expect, it } from "vitest";
import { isNavActive, navPageTitle } from "@/lib/nav";

describe("nav", () => {
  it("marks nested routes active", () => {
    expect(isNavActive("/explore", "/explore")).toBe(true);
    expect(isNavActive("/settings/foo", "/settings")).toBe(true);
    expect(isNavActive("/", "/explore")).toBe(false);
  });

  it("returns page titles", () => {
    expect(navPageTitle("/insights")).toBe("Insights");
    expect(navPageTitle("/privacy")).toBe("Open Splitwise");
  });
});
