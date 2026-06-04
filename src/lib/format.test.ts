import { describe, expect, it } from "vitest";
import { formatSyncProgressMessage } from "@/lib/format";

describe("formatSyncProgressMessage", () => {
  it("returns generic message when progress is missing", () => {
    expect(formatSyncProgressMessage(null)).toBe("Syncing…");
  });

  it("formats metadata steps", () => {
    expect(
      formatSyncProgressMessage({ phase: "metadata", label: "groups" }),
    ).toBe("Syncing groups…");
    expect(
      formatSyncProgressMessage({ phase: "metadata", label: "friends" }),
    ).toBe("Syncing friends…");
  });

  it("formats expense counts", () => {
    expect(formatSyncProgressMessage({ phase: "expenses", synced: 1200 })).toBe(
      "Syncing… 1,200 expenses",
    );
    expect(formatSyncProgressMessage({ phase: "expenses", synced: 0 })).toBe(
      "Syncing expenses…",
    );
  });
});
