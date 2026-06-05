import { describe, expect, it } from "vitest";
import { isStaleSyncState } from "@/lib/sync/stale-sync";

describe("isStaleSyncState", () => {
  it("returns false when a sync worker is active", () => {
    expect(
      isStaleSyncState(
        { expensesStatus: "syncing", syncPhase: "expenses" },
        true,
      ),
    ).toBe(false);
  });

  it("detects orphaned expense sync status", () => {
    expect(
      isStaleSyncState({ expensesStatus: "syncing", syncPhase: null }, false),
    ).toBe(true);
  });

  it("detects orphaned metadata progress", () => {
    expect(
      isStaleSyncState(
        { expensesStatus: "idle", syncPhase: "metadata" },
        false,
      ),
    ).toBe(true);
  });

  it("returns false for idle state", () => {
    expect(
      isStaleSyncState({ expensesStatus: "idle", syncPhase: null }, false),
    ).toBe(false);
  });
});
