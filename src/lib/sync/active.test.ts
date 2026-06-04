import { describe, expect, it } from "vitest";
import { isSyncActive } from "@/lib/sync/active";

describe("isSyncActive", () => {
  it("is true when the in-memory lock is held", () => {
    expect(
      isSyncActive({
        lockHeld: true,
        expensesStatus: "idle",
        progress: null,
      }),
    ).toBe(true);
  });

  it("is true when the database reports syncing", () => {
    expect(
      isSyncActive({
        lockHeld: false,
        expensesStatus: "syncing",
        progress: null,
      }),
    ).toBe(true);
  });

  it("is true during metadata progress", () => {
    expect(
      isSyncActive({
        lockHeld: false,
        expensesStatus: "idle",
        progress: { phase: "metadata", synced: 0, label: "groups" },
      }),
    ).toBe(true);
  });

  it("is false when idle", () => {
    expect(
      isSyncActive({
        lockHeld: false,
        expensesStatus: "idle",
        progress: null,
      }),
    ).toBe(false);
  });
});
