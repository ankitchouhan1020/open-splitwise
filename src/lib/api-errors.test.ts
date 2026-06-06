import { describe, expect, it } from "vitest";
import {
  friendlyAiError,
  friendlyApiError,
  friendlyExpenseError,
  friendlySyncError,
} from "@/lib/api-errors";

describe("friendlyApiError", () => {
  it("maps known codes", () => {
    expect(friendlyApiError("not_connected")).toContain("Settings");
    expect(friendlyApiError("rate_limited")).toContain("Too many");
    expect(friendlyApiError("database_not_configured")).toContain(
      "DATABASE_URL",
    );
    expect(friendlyApiError("splitwise_unavailable")).toContain(
      "temporarily unavailable",
    );
    expect(friendlyApiError("sync_in_progress")).toContain("already running");
  });

  it("falls back for unknown snake_case codes", () => {
    expect(friendlyApiError("unknown_code")).toBe(
      "Something went wrong. Try again.",
    );
  });
});

describe("friendlyAiError", () => {
  it("uses context-specific fallbacks", () => {
    expect(friendlyAiError("unknown_code", "filter")).toContain("filter");
    expect(friendlyAiError("unknown_code", "narrative")).toContain("summary");
    expect(friendlyAiError("ai_disabled", "settings")).toContain("Settings");
  });
});

describe("friendlySyncError", () => {
  it("maps auth failures", () => {
    expect(
      friendlySyncError("Splitwise authentication failed: token expired"),
    ).toContain("expired");
  });

  it("maps in-progress sync", () => {
    expect(friendlySyncError("Expense sync already in progress")).toContain(
      "already running",
    );
  });

  it("hides long technical messages", () => {
    expect(
      friendlySyncError(
        "Splitwise API error (502): very long technical dump ".repeat(5),
      ),
    ).toContain("Couldn't sync");
  });
});

describe("friendlyExpenseError", () => {
  it("formats validation details without field keys", () => {
    expect(
      friendlyExpenseError("splitwise_validation", {
        cost: ["must be greater than 0"],
      }),
    ).toBe("Amount: must be greater than 0");
  });

  it("combines base message with details for other codes", () => {
    expect(
      friendlyExpenseError("group_required", {
        group_id: ["is required"],
      }),
    ).toContain("Select a group");
  });
});
