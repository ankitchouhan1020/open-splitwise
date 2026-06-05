/** Credentials captured on the request thread for background sync work. */
export type SyncRunContext = {
  accountUserId: number;
  accessToken: string;
};

export type SyncScope = "all" | "expenses" | "metadata";
