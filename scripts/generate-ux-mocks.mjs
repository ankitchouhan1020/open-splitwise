#!/usr/bin/env node
/**
 * Generates Excalidraw wireframe mocks for UX improvement plan.
 * Run: node scripts/generate-ux-mocks.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../docs/design/mocks");

let idCounter = 0;
function uid() {
  return `el-${++idCounter}`;
}

function rect(x, y, w, h, opts = {}) {
  const id = uid();
  return {
    id,
    type: "rectangle",
    x,
    y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: opts.stroke ?? "#1e1e1e",
    backgroundColor: opts.fill ?? "transparent",
    fillStyle: opts.fill && opts.fill !== "transparent" ? "solid" : "hachure",
    strokeWidth: opts.strokeWidth ?? 1,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: opts.round ? { type: 3 } : null,
    seed: idCounter,
    version: 141,
    versionNonce: idCounter,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
  };
}

function text(x, y, content, opts = {}) {
  const id = uid();
  const size = opts.size ?? 16;
  const lines = content.split("\n");
  const lineHeight = size * 1.25;
  const h = lines.length * lineHeight;
  return {
    id,
    type: "text",
    x,
    y,
    width: opts.width ?? 280,
    height: h,
    angle: 0,
    strokeColor: opts.color ?? "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: idCounter,
    version: 141,
    versionNonce: idCounter,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    text: content,
    fontSize: size,
    fontFamily: 1,
    textAlign: opts.align ?? "left",
    verticalAlign: "top",
    containerId: null,
    originalText: content,
    lineHeight: 1.25,
  };
}

function line(x1, y1, x2, y2) {
  const id = uid();
  return {
    id,
    type: "line",
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    angle: 0,
    strokeColor: "#d6d3d1",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: idCounter,
    version: 141,
    versionNonce: idCounter,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    points: [
      [0, 0],
      [x2 - x1, y2 - y1],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: null,
  };
}

function phoneFrame(ox, oy, label) {
  const pw = 320;
  const ph = 640;
  const els = [
    rect(ox, oy, pw, ph, { stroke: "#78716c", round: true }),
    text(ox + 12, oy - 28, label, { size: 14, color: "#57534e" }),
    rect(ox + 8, oy + 8, pw - 16, 44, { fill: "#fafaf9", round: true }),
    rect(ox + 8, oy + ph - 72, pw - 16, 64, { fill: "#fafaf9", round: true }),
  ];
  return { els, inner: { x: ox + 16, y: oy + 60, w: pw - 32, h: ph - 140 } };
}

function webFrame(ox, oy, label) {
  const ww = 900;
  const wh = 560;
  const els = [
    rect(ox, oy, ww, wh, { stroke: "#78716c", round: true }),
    text(ox + 12, oy - 28, label, { size: 14, color: "#57534e" }),
    rect(ox + 8, oy + 8, ww - 16, 48, { fill: "#fafaf9", round: true }),
    rect(ox + 8, oy + 64, 180, wh - 72, { fill: "#f5f5f4", round: true }),
    rect(ox + 196, oy + 64, ww - 204, wh - 72, {
      fill: "#ffffff",
      round: true,
    }),
  ];
  return {
    els,
    sidebar: { x: ox + 20, y: oy + 80, w: 156 },
    main: { x: ox + 212, y: oy + 80, w: ww - 228 },
  };
}

function save(name, elements) {
  const doc = {
    type: "excalidraw",
    version: 2,
    source: "https://open-splitwise",
    elements,
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
    },
    files: {},
  };
  writeFileSync(join(OUT, name), JSON.stringify(doc, null, 2));
}

mkdirSync(OUT, { recursive: true });

// ── 01 Mobile: Friends & Balances ──────────────────────────────────────────
{
  idCounter = 0;
  const els = [];
  const { els: frame, inner } = phoneFrame(
    40,
    60,
    "Mobile — Friends & Balances",
  );
  els.push(...frame);

  let y = inner.y;
  els.push(text(inner.x, y, "Friends", { size: 22, width: inner.w }));
  y += 36;
  els.push(
    rect(inner.x, y, inner.w, 88, {
      fill: "#f0fdfa",
      round: true,
      stroke: "#0d9488",
    }),
  );
  els.push(
    text(inner.x + 12, y + 12, "Overall balance", {
      size: 11,
      color: "#57534e",
    }),
  );
  els.push(
    text(inner.x + 12, y + 32, "₹1,240 to get", {
      size: 20,
      color: "#0d9488",
      width: inner.w - 24,
    }),
  );
  els.push(
    text(inner.x + 12, y + 58, "₹320 to pay", { size: 14, color: "#b45309" }),
  );
  y += 100;

  els.push(text(inner.x, y, "To get", { size: 13, color: "#0d9488" }));
  y += 24;
  for (const [name, amt] of [
    ["Jonas", "₹840"],
    ["Priya", "₹400"],
  ]) {
    els.push(rect(inner.x, y, inner.w, 52, { fill: "#fafaf9", round: true }));
    els.push(text(inner.x + 12, y + 8, name, { size: 15 }));
    els.push(
      text(inner.x + inner.w - 80, y + 14, amt, {
        size: 15,
        color: "#0d9488",
        align: "right",
        width: 68,
      }),
    );
    els.push(
      rect(inner.x + inner.w - 148, y + 32, 132, 14, {
        fill: "#ccfbf1",
        round: true,
      }),
    );
    els.push(
      text(inner.x + inner.w - 144, y + 30, "Remind", {
        size: 10,
        color: "#0f766e",
        width: 124,
        align: "center",
      }),
    );
    y += 58;
  }

  y += 8;
  els.push(text(inner.x, y, "To pay", { size: 13, color: "#b45309" }));
  y += 24;
  els.push(rect(inner.x, y, inner.w, 52, { fill: "#fafaf9", round: true }));
  els.push(text(inner.x + 12, y + 8, "Alex", { size: 15 }));
  els.push(
    text(inner.x + inner.w - 80, y + 14, "₹320", {
      size: 15,
      color: "#b45309",
      align: "right",
      width: 68,
    }),
  );
  els.push(
    rect(inner.x + inner.w - 148, y + 32, 132, 14, {
      fill: "#fef3c7",
      round: true,
    }),
  );
  els.push(
    text(inner.x + inner.w - 144, y + 30, "Settle in Splitwise →", {
      size: 9,
      color: "#92400e",
      width: 124,
      align: "center",
    }),
  );

  // Bottom nav labels
  els.push(
    text(
      inner.x,
      inner.y + inner.h - 8,
      "Home · Explore · + · Stats · Settings",
      { size: 10, color: "#a8a29e", width: inner.w, align: "center" },
    ),
  );

  save("01-mobile-friends-balances.excalidraw", els);
}

// ── 02 Mobile: Group detail ────────────────────────────────────────────────
{
  idCounter = 0;
  const els = [];
  const { els: frame, inner } = phoneFrame(
    40,
    60,
    "Mobile — Group detail (Activity / Members)",
  );
  els.push(...frame);

  let y = inner.y;
  els.push(text(inner.x, y, "← Apartment 4B", { size: 18, width: inner.w }));
  y += 28;
  els.push(
    text(inner.x, y, "You owe ₹450 overall", { size: 14, color: "#b45309" }),
  );
  y += 32;

  const tabW = (inner.w - 8) / 2;
  els.push(rect(inner.x, y, tabW, 32, { fill: "#0d9488", round: true }));
  els.push(
    text(inner.x + 8, y + 8, "Activity", {
      size: 13,
      color: "#ffffff",
      width: tabW - 16,
      align: "center",
    }),
  );
  els.push(
    rect(inner.x + tabW + 8, y, tabW, 32, { fill: "#f5f5f4", round: true }),
  );
  els.push(
    text(inner.x + tabW + 16, y + 8, "Members", {
      size: 13,
      color: "#57534e",
      width: tabW - 16,
      align: "center",
    }),
  );
  y += 44;

  for (const [title, who, amt, group] of [
    ["Groceries", "You paid", "₹2,400", "split equally"],
    ["Electricity", "Jonas paid", "₹1,200", "you owe ₹300"],
    ["Netflix", "You paid", "₹499", "split equally"],
  ]) {
    els.push(rect(inner.x, y, inner.w, 72, { fill: "#fafaf9", round: true }));
    els.push(text(inner.x + 12, y + 8, title, { size: 15 }));
    els.push(
      text(inner.x + inner.w - 72, y + 8, amt, {
        size: 15,
        align: "right",
        width: 60,
      }),
    );
    els.push(text(inner.x + 12, y + 30, who, { size: 11, color: "#78716c" }));
    els.push(text(inner.x + 12, y + 48, group, { size: 11, color: "#0d9488" }));
    y += 78;
  }

  save("02-mobile-group-detail.excalidraw", els);
}

// ── 03 Mobile: Activity feed ─────────────────────────────────────────────
{
  idCounter = 0;
  const els = [];
  const { els: frame, inner } = phoneFrame(
    40,
    60,
    "Mobile — Activity (enhanced Explore)",
  );
  els.push(...frame);

  let y = inner.y;
  els.push(text(inner.x, y, "Activity", { size: 22, width: inner.w }));
  y += 32;
  els.push(rect(inner.x, y, inner.w, 36, { fill: "#f5f5f4", round: true }));
  els.push(
    text(inner.x + 12, y + 10, "🔍 Search expenses…", {
      size: 13,
      color: "#a8a29e",
    }),
  );
  y += 44;

  const filters = ["All", "Paid", "Received", "Expenses"];
  let fx = inner.x;
  for (const f of filters) {
    const w = f === "All" ? 44 : f === "Expenses" ? 72 : 64;
    els.push(
      rect(fx, y, w, 26, {
        fill: f === "All" ? "#0d9488" : "#f5f5f4",
        round: true,
      }),
    );
    els.push(
      text(fx + 6, y + 6, f, {
        size: 11,
        color: f === "All" ? "#fff" : "#57534e",
        width: w - 12,
        align: "center",
      }),
    );
    fx += w + 6;
  }
  y += 38;

  for (const [line1, line2, amt, color] of [
    ["You paid Alex", "Dinner · Trip to Goa", "₹420", "#b45309"],
    ["Jonas paid you", "Settlement", "₹200", "#0d9488"],
    ["Priya added", "Uber · Apartment 4B", "₹85", "#57534e"],
  ]) {
    els.push(rect(inner.x, y, inner.w, 64, { fill: "#fafaf9", round: true }));
    els.push(text(inner.x + 12, y + 8, line1, { size: 14 }));
    els.push(
      text(inner.x + inner.w - 72, y + 8, amt, {
        size: 14,
        color,
        align: "right",
        width: 60,
      }),
    );
    els.push(text(inner.x + 12, y + 30, line2, { size: 11, color: "#78716c" }));
    els.push(
      text(inner.x + 12, y + 46, "Jun 3 · 8:42 PM", {
        size: 10,
        color: "#a8a29e",
      }),
    );
    y += 70;
  }

  save("03-mobile-activity-feed.excalidraw", els);
}

// ── 04 Mobile: Add expense flow (reordered) ────────────────────────────────
{
  idCounter = 0;
  const els = [];
  const steps = [
    {
      title: "Step 1 — What is this?",
      fields: ["Description: Grocery shopping", "Date: Jun 5, 2026"],
      note: "Natural first question",
    },
    {
      title: "Step 2 — Who paid?",
      fields: ["You · ₹3,000", "Jonas · ₹2,000", "Total: ₹5,000 (auto-sum)"],
      note: "Sum = total amount",
    },
    {
      title: "Step 3 — Split with",
      fields: ["☑ You  ☑ Jonas  ☑ Priya", "☑ Alex  ☐ Sam"],
      note: "Select participants",
    },
    {
      title: "Step 4 — How to split",
      fields: ["Equal · ₹1,300 each", "— or —", "By item / share / exact"],
      note: "Advanced options visible",
    },
  ];

  steps.forEach((step, i) => {
    const ox = 40 + (i % 2) * 380;
    const oy = 60 + Math.floor(i / 2) * 420;
    const { els: frame, inner } = phoneFrame(ox, oy, step.title);
    els.push(...frame);
    let y = inner.y;
    els.push(
      text(inner.x, y, step.note, {
        size: 11,
        color: "#78716c",
        width: inner.w,
      }),
    );
    y += 24;
    for (const f of step.fields) {
      els.push(rect(inner.x, y, inner.w, 36, { fill: "#f5f5f4", round: true }));
      els.push(
        text(inner.x + 10, y + 10, f, { size: 13, width: inner.w - 20 }),
      );
      y += 42;
    }
    els.push(
      rect(inner.x, inner.y + inner.h - 40, inner.w, 32, {
        fill: "#0d9488",
        round: true,
      }),
    );
    els.push(
      text(inner.x + 8, inner.y + inner.h - 32, "Continue", {
        size: 14,
        color: "#fff",
        width: inner.w - 16,
        align: "center",
      }),
    );
  });

  save("04-mobile-add-expense-flow.excalidraw", els);
}

// ── 05 Web: Friends + Groups layout ───────────────────────────────────────
{
  idCounter = 0;
  const els = [];
  const {
    els: frame,
    sidebar,
    main,
  } = webFrame(40, 60, "Web — Friends & Groups hub");
  els.push(...frame);

  els.push(
    text(sidebar.x, sidebar.y, "Open Splitwise", {
      size: 12,
      color: "#78716c",
      width: sidebar.w,
    }),
  );
  let sy = sidebar.y + 28;
  for (const item of [
    "Home",
    "Friends",
    "Groups",
    "Explore",
    "Insights",
    "Settings",
  ]) {
    const active = item === "Friends";
    if (active)
      els.push(
        rect(sidebar.x - 4, sy - 2, sidebar.w + 8, 24, {
          fill: "#f0fdfa",
          round: true,
        }),
      );
    els.push(
      text(sidebar.x, sy, item, {
        size: 13,
        color: active ? "#0d9488" : "#44403c",
        width: sidebar.w,
      }),
    );
    sy += 28;
  }

  let y = main.y;
  els.push(text(main.x, y, "Friends", { size: 24, width: main.w }));
  y += 36;
  els.push(
    rect(main.x, y, main.w * 0.55, 100, {
      fill: "#f0fdfa",
      round: true,
      stroke: "#0d9488",
    }),
  );
  els.push(
    text(main.x + 16, y + 16, "Net: ₹920 to get", {
      size: 22,
      color: "#0d9488",
    }),
  );
  els.push(
    text(main.x + 16, y + 52, "In ₹1,240 · Out ₹320", {
      size: 13,
      color: "#57534e",
    }),
  );

  const col2x = main.x + main.w * 0.58;
  els.push(
    rect(col2x, y, main.w * 0.42, 100, { fill: "#fafaf9", round: true }),
  );
  els.push(
    text(col2x + 12, y + 16, "Quick actions", { size: 12, color: "#78716c" }),
  );
  els.push(
    text(col2x + 12, y + 40, "→ Settle up in Splitwise", {
      size: 13,
      color: "#0d9488",
    }),
  );
  els.push(text(col2x + 12, y + 62, "→ Export balances CSV", { size: 13 }));
  y += 116;

  els.push(text(main.x, y, "People", { size: 14, color: "#78716c" }));
  y += 24;
  els.push(rect(main.x, y, main.w, 28, { fill: "#f5f5f4", round: true }));
  els.push(
    text(main.x + 12, y + 6, "Name", {
      size: 11,
      color: "#78716c",
      width: 120,
    }),
  );
  els.push(
    text(main.x + 200, y + 6, "To get", {
      size: 11,
      color: "#78716c",
      width: 80,
      align: "center",
    }),
  );
  els.push(
    text(main.x + 300, y + 6, "To pay", {
      size: 11,
      color: "#78716c",
      width: 80,
      align: "center",
    }),
  );
  els.push(
    text(main.x + main.w - 120, y + 6, "Action", {
      size: 11,
      color: "#78716c",
      width: 100,
      align: "right",
    }),
  );
  y += 34;

  for (const [name, get, pay] of [
    ["Jonas", "₹840", "—"],
    ["Priya", "₹400", "—"],
    ["Alex", "—", "₹320"],
  ]) {
    els.push(line(main.x, y, main.x + main.w, y));
    els.push(text(main.x + 12, y + 6, name, { size: 14, width: 120 }));
    els.push(
      text(main.x + 200, y + 6, get, {
        size: 14,
        color: "#0d9488",
        width: 80,
        align: "center",
      }),
    );
    els.push(
      text(main.x + 300, y + 6, pay, {
        size: 14,
        color: "#b45309",
        width: 80,
        align: "center",
      }),
    );
    els.push(
      text(main.x + main.w - 120, y + 6, "View →", {
        size: 12,
        color: "#0d9488",
        width: 100,
        align: "right",
      }),
    );
    y += 32;
  }

  save("05-web-friends-groups-layout.excalidraw", els);
}

// ── 06 Web: Activity + complex split detail ───────────────────────────────
{
  idCounter = 0;
  const els = [];
  const {
    els: frame,
    sidebar,
    main,
  } = webFrame(40, 60, "Web — Activity list + complex split drawer");
  els.push(...frame);

  let sy = sidebar.y + 28;
  for (const item of [
    "Home",
    "Friends",
    "Groups",
    "Explore",
    "Insights",
    "Settings",
  ]) {
    const active = item === "Explore";
    if (active)
      els.push(
        rect(sidebar.x - 4, sy - 2, sidebar.w + 8, 24, {
          fill: "#f0fdfa",
          round: true,
        }),
      );
    els.push(
      text(sidebar.x, sy, item, {
        size: 13,
        color: active ? "#0d9488" : "#44403c",
        width: sidebar.w,
      }),
    );
    sy += 28;
  }

  const listW = main.w * 0.55;
  let y = main.y;
  els.push(text(main.x, y, "Activity", { size: 22, width: listW }));
  y += 32;
  els.push(rect(main.x, y, listW, 32, { fill: "#f5f5f4", round: true }));
  els.push(text(main.x + 10, y + 8, "Search…", { size: 12, color: "#a8a29e" }));
  y += 40;

  for (const row of [
    ["Grocery run", "Apartment 4B · Jun 5", "₹5,000"],
    ["Dinner", "Trip to Goa · Jun 3", "₹420"],
  ]) {
    const selected = row[0] === "Grocery run";
    els.push(
      rect(main.x, y, listW, 48, {
        fill: selected ? "#f0fdfa" : "#fafaf9",
        round: true,
        stroke: selected ? "#0d9488" : "#e7e5e4",
      }),
    );
    els.push(text(main.x + 12, y + 8, row[0], { size: 14 }));
    els.push(
      text(main.x + listW - 72, y + 8, row[2], {
        size: 14,
        align: "right",
        width: 60,
      }),
    );
    els.push(text(main.x + 12, y + 28, row[1], { size: 11, color: "#78716c" }));
    y += 54;
  }

  const dx = main.x + listW + 16;
  const dw = main.w - listW - 16;
  els.push(
    rect(dx, main.y, dw, main.y + 400 - main.y, {
      fill: "#ffffff",
      round: true,
      stroke: "#d6d3d1",
    }),
  );
  let dy = main.y + 16;
  els.push(text(dx + 12, dy, "Grocery run", { size: 18, width: dw - 24 }));
  dy += 28;
  els.push(
    text(dx + 12, dy, "₹5,000 · You + Jonas paid", {
      size: 12,
      color: "#78716c",
      width: dw - 24,
    }),
  );
  dy += 32;
  els.push(
    text(dx + 12, dy, "Split breakdown", { size: 13, color: "#0d9488" }),
  );
  dy += 24;
  for (const [item, split] of [
    ["Fruits & veg", "Equal · 4 people"],
    ["FMCG (subset)", "Equal · You, Jonas, Priya"],
    ["Protein powder", "By share · 2 people"],
    ["Personal care", "Not shared"],
  ]) {
    els.push(rect(dx + 12, dy, dw - 24, 40, { fill: "#fafaf9", round: true }));
    els.push(text(dx + 20, dy + 6, item, { size: 12 }));
    els.push(text(dx + 20, dy + 22, split, { size: 10, color: "#78716c" }));
    dy += 46;
  }
  els.push(
    rect(dx + 12, dy + 8, dw - 24, 28, { fill: "#0d9488", round: true }),
  );
  els.push(
    text(dx + 16, dy + 14, "Open in Splitwise", {
      size: 12,
      color: "#fff",
      width: dw - 32,
      align: "center",
    }),
  );

  save("06-web-activity-complex-split.excalidraw", els);
}

// ── 07 Mobile + Web: Dark mode & a11y tokens ──────────────────────────────
{
  idCounter = 0;
  const els = [];

  const { els: lightFrame, inner: light } = phoneFrame(
    40,
    60,
    "Light theme (current)",
  );
  els.push(...lightFrame);
  els.push(
    rect(light.x, light.y, light.w, 120, { fill: "#fafaf9", round: true }),
  );
  els.push(text(light.x + 12, light.y + 16, "Balance card", { size: 14 }));
  els.push(
    text(light.x + 12, light.y + 40, "₹1,240 to get", {
      size: 18,
      color: "#0d9488",
    }),
  );
  els.push(
    text(light.x + 12, light.y + 72, "Contrast: AA ✓", {
      size: 11,
      color: "#16a34a",
    }),
  );

  const { els: darkFrame, inner: dark } = phoneFrame(
    400,
    60,
    "Dark theme (proposed)",
  );
  els.push(...darkFrame);
  els.push(
    rect(dark.x, dark.y, dark.w, 120, {
      fill: "#1c1917",
      round: true,
      stroke: "#44403c",
    }),
  );
  els.push(
    text(dark.x + 12, dark.y + 16, "Balance card", {
      size: 14,
      color: "#fafaf9",
    }),
  );
  els.push(
    text(dark.x + 12, dark.y + 40, "₹1,240 to get", {
      size: 18,
      color: "#2dd4bf",
    }),
  );
  els.push(
    text(dark.x + 12, dark.y + 72, "Contrast: AA ✓ (7:1 body)", {
      size: 11,
      color: "#4ade80",
    }),
  );

  els.push(
    text(
      40,
      740,
      "Token changes: --background, --foreground, --card, --accent; teal accent preserved; amber/teal balance colors tuned for dark",
      { size: 13, color: "#57534e", width: 700 },
    ),
  );

  save("07-theme-dark-mode-a11y.excalidraw", els);
}

console.log(`Wrote Excalidraw mocks to ${OUT}`);
