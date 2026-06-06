import { describe, expect, it } from "vitest";
import { friendlyAiError } from "@/lib/ai/ui-errors";

describe("friendlyAiError", () => {
  it("maps known API codes", () => {
    expect(friendlyAiError("ai_disabled")).toContain("Settings");
    expect(friendlyAiError("rate_limited")).toContain("Too many");
  });

  it("falls back for unknown codes", () => {
    expect(friendlyAiError("unknown_code")).toBe(
      "Couldn't apply that filter. Try rephrasing.",
    );
  });
});
