import { describe, expect, it } from "vitest";
import {
  exploreGroupHref,
  peopleGroupExploreHref,
  peopleFriendExploreHref,
} from "@/lib/expenses/filters";

describe("people explore defaults", () => {
  it("peopleGroupExploreHref excludes settlements and scopes currency", () => {
    const href = peopleGroupExploreHref(42, "USD");
    expect(href).toContain("group=42");
    expect(href).toContain("payment=0");
    expect(href).toContain("currency=USD");
  });

  it("peopleFriendExploreHref excludes settlements", () => {
    const href = peopleFriendExploreHref(9, "EUR");
    expect(href).toContain("friend=9");
    expect(href).toContain("payment=0");
    expect(href).toContain("currency=EUR");
  });

  it("exploreGroupHref excludes settlement payments", () => {
    const href = exploreGroupHref(42);
    expect(href).toContain("group=42");
    expect(href).toContain("payment=0");
  });
});
