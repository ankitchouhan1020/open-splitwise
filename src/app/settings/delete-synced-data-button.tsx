"use client";

import { friendlyApiError } from "@/lib/api-errors";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteSyncedDataButton() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteSyncedData() {
    if (
      !confirm(
        "Delete all synced expenses and metadata for your account from this server? Your Splitwise session stays active — you can sync again afterward.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete-synced-data", {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        alert(
          body.message ??
            friendlyApiError(
              body.error,
              "Couldn't delete synced data. Try again.",
            ),
        );
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void deleteSyncedData()}
      disabled={deleting}
      className="border-border text-muted hover:text-foreground hover:bg-error-bg hover:text-error-text shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete all"}
    </button>
  );
}
