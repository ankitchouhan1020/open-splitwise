"use client";

import { GroupSettleList } from "@/components/group-settle-list";
import { IconClose } from "@/components/expense-icons";
import { SettleUpForm } from "@/components/settle-up-form";
import type {
  SettleUpDrawerMode,
  SettleUpGroupContext,
  SettleUpInitial,
} from "@/components/settle-up-provider";
import { useEffect } from "react";

type Props = {
  open: boolean;
  mode: SettleUpDrawerMode | null;
  onClose: () => void;
  onBack: () => void;
  onSelectGroupMember: (
    initial: SettleUpInitial,
    group: SettleUpGroupContext,
  ) => void;
};

function drawerSubtitle(mode: SettleUpDrawerMode): string {
  if (mode.type === "friend") {
    return `with ${mode.initial.friendName}`;
  }
  if (mode.type === "group-list") {
    return `in ${mode.group.groupName}`;
  }
  return `with ${mode.initial.friendName} in ${mode.group.groupName}`;
}

function drawerInitial(mode: SettleUpDrawerMode): SettleUpInitial | null {
  if (mode.type === "friend" || mode.type === "group-record") {
    return mode.initial;
  }
  return null;
}

export function SettleUpDrawer({
  open,
  mode,
  onClose,
  onBack,
  onSelectGroupMember,
}: Props) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mode) return null;

  const showBack = mode.type === "group-record";
  const initial = drawerInitial(mode);

  return (
    <>
      <button
        type="button"
        className="add-drawer-backdrop bg-overlay fixed inset-0 z-50"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="settle-up-title"
        className="add-drawer-panel border-border bg-card fixed inset-x-0 bottom-0 z-[51] flex max-h-[min(92dvh,760px)] w-full flex-col rounded-t-2xl border shadow-2xl sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:h-full sm:max-h-none sm:max-w-[520px] sm:rounded-none sm:rounded-l-2xl"
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden">
          <span className="bg-border/80 h-1 w-9 rounded-full" aria-hidden />
        </div>
        <div className="border-border flex shrink-0 flex-col gap-0.5 border-b px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {showBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-muted hover:text-foreground hover:bg-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                  aria-label="Back to group list"
                >
                  <span aria-hidden className="text-lg leading-none">
                    ←
                  </span>
                </button>
              ) : null}
              <h2
                id="settle-up-title"
                className="text-foreground truncate text-[17px] font-semibold tracking-tight"
              >
                Settle up
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-foreground hover:bg-hover inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
              aria-label="Close"
            >
              <IconClose className="h-[17px] w-[17px]" />
            </button>
          </div>
          <p className="text-muted text-sm">{drawerSubtitle(mode)}</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          {mode.type === "group-list" ? (
            <div className="min-h-0 flex-1 overflow-y-auto py-2">
              <GroupSettleList
                group={mode.group}
                onSelectMember={(memberInitial) =>
                  onSelectGroupMember(memberInitial, mode.group)
                }
              />
            </div>
          ) : initial ? (
            <SettleUpForm initial={initial} onSuccess={onClose} />
          ) : null}
        </div>
      </aside>
    </>
  );
}
