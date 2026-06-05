"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  className?: string;
  label?: string;
};

export function DemoModeButton({ className, label = "Try demo" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      if (!res.ok) return;
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startDemo()}
      disabled={loading}
      className={className}
    >
      {loading ? "Loading demo…" : label}
    </button>
  );
}
