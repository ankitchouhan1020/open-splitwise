import { describe, expect, it } from "vitest";
import {
  formatSplitwiseUserName,
  isPlaceholderUserName,
  participantNamesFromExpenseRaw,
} from "@/lib/users/resolve-names";

describe("formatSplitwiseUserName", () => {
  it("falls back to User id when names are missing", () => {
    expect(formatSplitwiseUserName(null, null, 123)).toBe("User 123");
    expect(formatSplitwiseUserName("Jordan", "Lee")).toBe("Jordan Lee");
  });
});

describe("participantNamesFromExpenseRaw", () => {
  it("reads names from expense raw users", () => {
    const map = participantNamesFromExpenseRaw({
      users: [
        {
          user_id: 42,
          user: { first_name: "Sam", last_name: "Patel" },
        },
      ],
    });
    expect(map.get(42)).toBe("Sam Patel");
  });
});

describe("isPlaceholderUserName", () => {
  it("detects generated placeholders", () => {
    expect(isPlaceholderUserName("User 12800636")).toBe(true);
    expect(isPlaceholderUserName("Jordan Lee")).toBe(false);
  });
});
