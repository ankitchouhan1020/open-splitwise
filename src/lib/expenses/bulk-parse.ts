export type BulkExpenseRow = {
  lineNumber: number;
  description: string;
  cost: string;
};

export type BulkParseError = {
  lineNumber: number;
  raw: string;
  message: string;
};

export type BulkParseResult = {
  rows: BulkExpenseRow[];
  errors: BulkParseError[];
};

const AMOUNT_RE = /^[\d.,]+$/;

function normalizeAmount(raw: string): string | null {
  let s = raw.trim().replace(/[^\d.,]/g, "");
  if (!s || !AMOUNT_RE.test(s)) return null;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      s = `${parts[0].replace(/\./g, "")}.${parts[1]}`;
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (
    n
      .toFixed(2)
      .replace(/\.?0+$/, "")
      .replace(/\.$/, "") || "0"
  );
}

function isAmountToken(token: string): boolean {
  return normalizeAmount(token) !== null;
}

function rowFromParts(
  lineNumber: number,
  description: string,
  amountRaw: string,
): BulkExpenseRow | BulkParseError {
  const cost = normalizeAmount(amountRaw);
  const desc = description.trim();
  if (!desc) {
    return {
      lineNumber,
      raw: description,
      message: "Missing description",
    };
  }
  if (!cost) {
    return {
      lineNumber,
      raw: amountRaw,
      message: "Invalid amount",
    };
  }
  return { lineNumber, description: desc, cost };
}

function parseLine(
  raw: string,
  lineNumber: number,
): BulkExpenseRow | BulkParseError | null {
  const line = raw.trim();
  if (!line || line.startsWith("#")) return null;

  if (line.includes("\t")) {
    const [a, b, ...rest] = line.split("\t").map((p) => p.trim());
    if (rest.length > 0) {
      return { lineNumber, raw: line, message: "Use one tab between fields" };
    }
    if (a && b) {
      if (isAmountToken(a)) {
        return rowFromParts(lineNumber, b, a);
      }
      if (isAmountToken(b)) {
        return rowFromParts(lineNumber, a, b);
      }
    }
  }

  const commaMatch = line.match(/^(.+?),\s*([\d.,]+)$/);
  if (commaMatch) {
    return rowFromParts(lineNumber, commaMatch[1], commaMatch[2]);
  }

  const amountFirst = line.match(/^([\d.,]+)\s+(.+)$/);
  if (amountFirst) {
    return rowFromParts(lineNumber, amountFirst[2], amountFirst[1]);
  }

  const amountLast = line.match(/^(.+?)\s+([\d.,]+)$/);
  if (amountLast) {
    return rowFromParts(lineNumber, amountLast[1], amountLast[2]);
  }

  return {
    lineNumber,
    raw: line,
    message: "Use “description, amount” or paste from a spreadsheet",
  };
}

export function parseBulkExpenseText(text: string): BulkParseResult {
  const lines = text.split(/\r?\n/);
  const rows: BulkExpenseRow[] = [];
  const errors: BulkParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i + 1);
    if (!parsed) continue;
    if ("message" in parsed) {
      errors.push(parsed);
    } else {
      rows.push(parsed);
    }
  }

  return { rows, errors };
}
