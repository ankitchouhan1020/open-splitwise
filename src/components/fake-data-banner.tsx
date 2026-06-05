"use client";

import Link from "next/link";

type Props = {
  guestDemo?: boolean;
  showcase?: boolean;
};

export function FakeDataBanner({ guestDemo = false, showcase = false }: Props) {
  return (
    <div
      className="border-warn-border bg-warn-bg text-warn-text flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b px-4 py-2 text-center text-xs sm:text-sm"
      role="status"
    >
      <span className="font-medium">Sample data</span>
      <span className="text-warn-text/90">
        {showcase
          ? "— add Splitwise credentials in Settings to use your own expenses."
          : guestDemo
            ? "— fictional expenses for browsing this demo."
            : "— tap the mask icon in the header to show your real expenses."}
      </span>
      {showcase ? (
        <Link
          href="/settings"
          className="font-semibold underline underline-offset-2 hover:no-underline"
        >
          Set up
        </Link>
      ) : guestDemo ? (
        <GuestExitButton />
      ) : null}
    </div>
  );
}

function GuestExitButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void fetch("/api/demo/stop", { method: "POST" }).then(() => {
          window.location.href = "/";
        });
      }}
      className="font-semibold underline underline-offset-2 hover:no-underline"
    >
      Exit demo
    </button>
  );
}
