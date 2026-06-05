import { describe, expect, it } from "vitest";
import {
  isAnySyncInProgress,
  releaseExpenseSync,
  releaseMetadataSync,
  tryAcquireExpenseSync,
  tryAcquireMetadataSync,
} from "@/lib/sync/lock";

describe("per-tenant sync locks", () => {
  it("allows concurrent syncs for different tenants", () => {
    expect(tryAcquireExpenseSync(1)).toBe(true);
    expect(tryAcquireExpenseSync(2)).toBe(true);
    expect(tryAcquireExpenseSync(1)).toBe(false);
    releaseExpenseSync(1);
    releaseExpenseSync(2);
  });

  it("scopes metadata and expense locks per tenant", () => {
    expect(tryAcquireMetadataSync(10)).toBe(true);
    expect(isAnySyncInProgress(10)).toBe(true);
    expect(isAnySyncInProgress(11)).toBe(false);
    releaseMetadataSync(10);
    expect(isAnySyncInProgress(10)).toBe(false);
  });
});
