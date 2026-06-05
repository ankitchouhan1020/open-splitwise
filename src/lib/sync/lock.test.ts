import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn(),
  getPostgresSql: vi.fn(),
  schema: { syncState: {} },
}));

vi.mock("@/lib/db/config", () => ({
  isDatabaseConfigured: () => false,
}));

import {
  isAnySyncInProgress,
  releaseExpenseSync,
  releaseMetadataSync,
  resetMemorySyncLocksForTests,
  tryAcquireExpenseSync,
  tryAcquireMetadataSync,
} from "@/lib/sync/lock";

describe("per-tenant sync locks", () => {
  afterEach(() => {
    resetMemorySyncLocksForTests();
  });

  it("allows concurrent syncs for different tenants", async () => {
    expect(await tryAcquireExpenseSync(1)).toBe(true);
    expect(await tryAcquireExpenseSync(2)).toBe(true);
    expect(await tryAcquireExpenseSync(1)).toBe(false);
    await releaseExpenseSync(1);
    await releaseExpenseSync(2);
  });

  it("scopes metadata and expense locks per tenant", async () => {
    expect(await tryAcquireMetadataSync(10)).toBe(true);
    expect(await isAnySyncInProgress(10)).toBe(true);
    expect(await isAnySyncInProgress(11)).toBe(false);
    await releaseMetadataSync(10);
    expect(await isAnySyncInProgress(10)).toBe(false);
  });
});
