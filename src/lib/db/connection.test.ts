import { describe, expect, it } from "vitest";
import { isLocalHyperdriveProxy } from "@/lib/db/hyperdrive-local";

describe("isLocalHyperdriveProxy", () => {
  it("detects wrangler local Hyperdrive hostnames", () => {
    expect(
      isLocalHyperdriveProxy(
        "postgresql://user:pass@788f3f2fe5793c599f1dee718ff308d8.hyperdrive.local:5432/db",
      ),
    ).toBe(true);
  });

  it("does not match deployed Hyperdrive URLs", () => {
    expect(
      isLocalHyperdriveProxy("postgresql://user:pass@db.example.com:5432/db"),
    ).toBe(false);
  });
});
