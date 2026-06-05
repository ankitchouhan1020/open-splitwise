import type { SplitwiseUser } from "@/lib/splitwise/types";

export const DEMO_USER: SplitwiseUser = {
  id: 900_001,
  first_name: "Alex",
  last_name: "Morgan",
  email: "alex.morgan@example.com",
  default_currency: "USD",
};

export const DEMO_OWNER_SPLITWISE_ID = DEMO_USER.id;
