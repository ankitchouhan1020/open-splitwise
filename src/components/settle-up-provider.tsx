"use client";

import { SettleUpDrawer } from "@/components/settle-up-drawer";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SettleUpInitial = {
  friendUserId: number;
  friendName: string;
  direction: "you_pay" | "they_pay_you";
  amount: number;
  currency: string;
  groupId?: number;
  groupName?: string;
};

export type SettleUpGroupContext = {
  groupId: number;
  groupName: string;
  currency: string;
};

export type SettleUpDrawerMode =
  | { type: "friend"; initial: SettleUpInitial }
  | { type: "group-list"; group: SettleUpGroupContext }
  | {
      type: "group-record";
      initial: SettleUpInitial;
      group: SettleUpGroupContext;
    };

type SettleUpContextValue = {
  open: boolean;
  mode: SettleUpDrawerMode | null;
  openSettleUp: (initial: SettleUpInitial) => void;
  openGroupSettleUp: (group: SettleUpGroupContext) => void;
  openGroupMemberSettleUp: (
    initial: SettleUpInitial,
    group: SettleUpGroupContext,
  ) => void;
  backToGroupList: () => void;
  closeSettleUp: () => void;
};

const SettleUpContext = createContext<SettleUpContextValue | null>(null);

export function SettleUpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SettleUpDrawerMode | null>(null);

  const openSettleUp = useCallback((initial: SettleUpInitial) => {
    setMode({ type: "friend", initial });
    setOpen(true);
  }, []);

  const openGroupSettleUp = useCallback((group: SettleUpGroupContext) => {
    setMode({ type: "group-list", group });
    setOpen(true);
  }, []);

  const openGroupMemberSettleUp = useCallback(
    (initial: SettleUpInitial, group: SettleUpGroupContext) => {
      setMode({
        type: "group-record",
        initial: {
          ...initial,
          groupId: group.groupId,
          groupName: group.groupName,
        },
        group,
      });
      setOpen(true);
    },
    [],
  );

  const backToGroupList = useCallback(() => {
    setMode((current) => {
      if (current?.type !== "group-record") return current;
      return { type: "group-list", group: current.group };
    });
  }, []);

  const closeSettleUp = useCallback(() => {
    setOpen(false);
    setMode(null);
  }, []);

  const value = useMemo(
    () => ({
      open,
      mode,
      openSettleUp,
      openGroupSettleUp,
      openGroupMemberSettleUp,
      backToGroupList,
      closeSettleUp,
    }),
    [
      open,
      mode,
      openSettleUp,
      openGroupSettleUp,
      openGroupMemberSettleUp,
      backToGroupList,
      closeSettleUp,
    ],
  );

  return (
    <SettleUpContext.Provider value={value}>
      {children}
      <SettleUpDrawer
        open={open}
        mode={mode}
        onClose={closeSettleUp}
        onBack={backToGroupList}
        onSelectGroupMember={openGroupMemberSettleUp}
      />
    </SettleUpContext.Provider>
  );
}

export function useSettleUpDialog() {
  const ctx = useContext(SettleUpContext);
  if (!ctx) {
    throw new Error("useSettleUpDialog must be used within SettleUpProvider");
  }
  return ctx;
}

/** Safe outside provider — no-op when unavailable. */
export function useSettleUpDialogOptional() {
  return useContext(SettleUpContext);
}
