"use client";

type Props = {
  guestDemo?: boolean;
};

export function FakeDataBanner({ guestDemo = false }: Props) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm"
      role="status"
    >
      <span className="font-medium">Sample data</span>
      <span className="text-amber-900/90">
        {guestDemo
          ? "— fictional expenses for browsing this demo."
          : "— tap the mask icon in the header to show your real expenses."}
      </span>
      {guestDemo && <GuestExitButton />}
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
