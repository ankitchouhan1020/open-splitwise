"use client";

import { splitwiseExpenseUrl } from "@/lib/splitwise/urls";
import { useEffect, useState } from "react";

type Group = { id: number; name: string };
type Category = { id: number; name: string };

export function AddExpenseForm() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
    link?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/filters/options")
      .then((r) => r.json())
      .then(
        (data: {
          groups: Group[];
          categories: Category[];
          currencies: string[];
        }) => {
          setGroups(data.groups.filter((g) => g.id > 0));
          setCategories(data.categories);
          if (data.currencies[0]) setCurrencyCode(data.currencies[0]);
        },
      )
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId),
          description,
          cost,
          currencyCode,
          categoryId: categoryId ? Number(categoryId) : undefined,
          date: date ? new Date(date).toISOString() : undefined,
          details: details || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        splitwiseId?: number;
        error?: string;
        details?: Record<string, string[]>;
      };
      if (!res.ok) {
        const detailText = data.details
          ? Object.entries(data.details)
              .map(([k, v]) => `${k}: ${v.join(", ")}`)
              .join("; ")
          : "";
        setMessage({
          type: "error",
          text: `${data.error ?? "Failed"}${detailText ? ` — ${detailText}` : ""}`,
        });
        return;
      }
      if (data.splitwiseId) {
        setMessage({
          type: "ok",
          text: "Expense created (equal split). Custom splits and settle-up stay in Splitwise.",
          link: splitwiseExpenseUrl(data.splitwiseId),
        });
        setDescription("");
        setCost("");
        setDetails("");
      }
    } catch {
      setMessage({ type: "error", text: "Request failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="border-border bg-card space-y-3 rounded-xl border p-4"
    >
      <h3 className="text-sm font-semibold">Add group expense</h3>
      <p className="text-muted text-xs">
        Creates an equal split via Splitwise API. Custom splits and settle-up
        remain in Splitwise.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
          <span className="text-muted font-medium">Group *</span>
          <select
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">Select group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
          <span className="text-muted font-medium">Description *</span>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Cost *</span>
          <input
            required
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Currency *</span>
          <input
            required
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted font-medium">Date</span>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
          <span className="text-muted font-medium">Details</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className="border-border rounded-md border px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-accent rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create expense"}
      </button>
      {message && (
        <p
          className={
            message.type === "ok"
              ? "text-sm text-teal-800"
              : "text-sm text-red-700"
          }
        >
          {message.text}{" "}
          {message.link && (
            <a
              href={message.link}
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Splitwise
            </a>
          )}
        </p>
      )}
    </form>
  );
}
