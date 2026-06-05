#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../src");

const REPLACEMENTS = [
  [
    "rounded-md bg-stone-800 px-2.5 py-1.5 text-xs font-medium text-white",
    "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium",
  ],
  [
    "shrink-0 rounded-md bg-stone-800 px-2.5 py-1.5 text-xs font-medium text-white",
    "bg-pill-active text-pill-active-fg shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium",
  ],
  [
    "rounded-md bg-stone-800 px-2.5 py-1 text-xs font-medium text-white",
    "bg-pill-active text-pill-active-fg rounded-md px-2.5 py-1 text-xs font-medium",
  ],
  [
    "shrink-0 rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white",
    "bg-accent text-accent-foreground shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
  ],
  [
    "rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white",
    "bg-accent text-accent-foreground rounded-md px-2.5 py-1 text-xs font-medium",
  ],
  ["hover:bg-stone-200", "hover:bg-hover"],
  ["hover:bg-stone-100", "hover:bg-hover"],
  ["hover:bg-stone-50/80", "hover:bg-hover"],
  ["hover:bg-stone-50", "hover:bg-hover"],
  ["active:bg-stone-100/80", "active:bg-active"],
  ["active:bg-stone-100", "active:bg-active"],
  ["bg-stone-100/90", "bg-header-subtle"],
  ["bg-stone-50/80", "bg-muted-surface"],
  ["bg-stone-50/60", "bg-muted-surface"],
  ["bg-stone-50/50", "bg-muted-surface/50"],
  ["bg-stone-50", "bg-muted-surface"],
  ["bg-stone-100", "bg-muted-surface"],
  ["bg-stone-950/5", "bg-muted-surface/40"],
  ["border-stone-200", "border-border"],
  ["border-stone-100", "border-border"],
  ["from-stone-50", "from-gradient-from"],
  ["to-white", "to-gradient-to"],
  ["bg-white", "bg-card"],
  ["text-stone-900", "text-foreground"],
  ["text-stone-800", "text-foreground"],
  ["text-stone-700", "text-foreground"],
  ["text-stone-600", "text-muted"],
  ["text-stone-500", "text-muted"],
  ["text-stone-400", "text-muted"],
  ["border-stone-300", "border-border"],
  ["hover:border-stone-300", "hover:border-border"],
  ["dark:hover:border-stone-600", "hover:border-border"],
  ["text-teal-800", "text-balance-get"],
  ["text-teal-700", "text-balance-get"],
  ["text-teal-900", "text-success-text"],
  ["text-teal-200", "text-balance-get/70"],
  ["text-amber-800", "text-balance-pay"],
  ["text-amber-700", "text-balance-pay"],
  ["text-amber-900", "text-warn-text"],
  ["text-amber-950", "text-warn-text"],
  ["text-amber-900/90", "text-warn-text/90"],
  ["bg-teal-50", "bg-success-bg"],
  ["bg-teal-100", "bg-balance-get-bg"],
  ["bg-amber-50", "bg-warn-bg"],
  ["bg-amber-100", "bg-balance-pay-bg"],
  ["border-teal-200", "border-success-border"],
  ["border-amber-200", "border-warn-border"],
  ["bg-red-50", "bg-error-bg"],
  ["text-red-800", "text-error-text"],
  ["text-red-900", "text-error-text"],
  ["border-red-200", "border-error-border"],
  ["bg-violet-100", "bg-violet-bg"],
  ["text-violet-800", "text-violet-text"],
  ["bg-indigo-50", "bg-indigo-bg"],
  ["text-indigo-900", "text-indigo-text"],
  ["bg-amber-100", "bg-balance-pay-bg"],
  ["ring-amber-200", "ring-warn-border"],
  ["hover:bg-amber-50", "hover:bg-hover"],
  ["hover:bg-teal-100", "hover:bg-hover"],
  ["hover:bg-red-50", "hover:bg-hover"],
  ["hover:text-red-800", "hover:text-error-text"],
  [
    "bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-balance-pay hover:bg-hover",
    "bg-balance-pay-bg px-2.5 py-1.5 text-[11px] font-semibold text-balance-pay hover:bg-hover",
  ],
  [
    "bg-teal-50 px-2.5 py-1.5 text-[11px] font-semibold text-balance-get hover:bg-hover",
    "bg-balance-get-bg px-2.5 py-1.5 text-[11px] font-semibold text-balance-get hover:bg-hover",
  ],
  ["rounded bg-amber-100 px-0.5", "rounded bg-highlight-bg px-0.5"],
  ['text-teal-700">Settlement', 'text-settlement">Settlement'],
  ["border-l-teal-500", "border-l-balance-get-border"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (
      /\.(tsx|ts)$/.test(name) &&
      !p.includes("ui-classes.ts") &&
      !p.includes("tone-styles.ts") &&
      !p.includes("balance-style.ts")
    )
      files.push(p);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let text = readFileSync(file, "utf8");
  const orig = text;
  for (const [from, to] of REPLACEMENTS) {
    text = text.split(from).join(to);
  }
  if (text !== orig) {
    writeFileSync(file, text);
    changed++;
  }
}
console.log(`Updated ${changed} files`);
