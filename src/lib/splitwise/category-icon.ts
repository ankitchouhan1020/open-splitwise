export type CategoryIconStyle = {
  iconUrl: string;
  /** Pastel tile background from Splitwise `colors.light`. */
  backgroundColor: string;
  /** Transparent/filled icons sit inset; square assets fill the tile. */
  fullBleed?: boolean;
};

export const PAYMENT_ICON_COLORS = {
  backgroundColor: "#d6ece4",
  foregroundColor: "#157a52",
} as const;

type RawCategory = {
  id?: number;
  icon?: string;
  icon_types?: {
    square?: { large?: string; xlarge?: string };
    transparent?: { large?: string; xlarge?: string };
    filled_color_light?: { large?: string; xlarge?: string };
    slim?: { small?: string; large?: string };
  };
  colors?: {
    background?: { light?: string; dark?: string };
    light?: string;
  };
  subcategories?: RawCategory[];
};

/** Parse Splitwise 8-digit hex colors (#RRGGBBAA) to CSS. */
export function splitwiseColorToCss(value: string): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{8}$/.test(v)) {
    const r = Number.parseInt(v.slice(1, 3), 16);
    const g = Number.parseInt(v.slice(3, 5), 16);
    const b = Number.parseInt(v.slice(5, 7), 16);
    const a = Number.parseInt(v.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return v;
}

export function categoryIconFromRaw(raw: unknown): CategoryIconStyle | null {
  if (!raw || typeof raw !== "object") return null;
  const cat = raw as RawCategory;

  const transparentUrl =
    cat.icon_types?.transparent?.xlarge ||
    cat.icon_types?.transparent?.large ||
    null;
  const filledUrl =
    cat.icon_types?.filled_color_light?.xlarge ||
    cat.icon_types?.filled_color_light?.large ||
    null;
  const squareUrl =
    cat.icon_types?.square?.xlarge ||
    cat.icon_types?.square?.large ||
    (cat.icon?.includes("/square") ? cat.icon : null);

  const iconUrl = transparentUrl || filledUrl || squareUrl || null;

  if (!iconUrl) return null;

  const bgRaw = cat.colors?.light || "#e7e5e4";

  return {
    iconUrl,
    backgroundColor: splitwiseColorToCss(bgRaw),
    fullBleed: !transparentUrl && !filledUrl,
  };
}

export function flattenCategoryIcons(
  categories: RawCategory[],
): Map<number, CategoryIconStyle> {
  const map = new Map<number, CategoryIconStyle>();

  function walk(items: RawCategory[]) {
    for (const item of items) {
      if (item.id != null) {
        const style = categoryIconFromRaw(item);
        if (style) map.set(item.id, style);
      }
      if (item.subcategories?.length) walk(item.subcategories);
    }
  }

  walk(categories);
  return map;
}

export const SPLITWISE_CATEGORIES_URL =
  "https://secure.splitwise.com/api/v3.0/get_categories";

export async function fetchSplitwiseCategoryIconMap(): Promise<
  Map<number, CategoryIconStyle>
> {
  const res = await fetch(SPLITWISE_CATEGORIES_URL, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error("Failed to load Splitwise categories");
  }
  const data = (await res.json()) as { categories?: RawCategory[] };
  return flattenCategoryIcons(data.categories ?? []);
}

export function resolveCategoryIcon(
  categoryId: number | null | undefined,
  categoryRaw: unknown | null | undefined,
  iconMap: Map<number, CategoryIconStyle> | undefined,
): CategoryIconStyle | null {
  const fromRaw = categoryIconFromRaw(categoryRaw);
  if (fromRaw) return fromRaw;
  if (categoryId != null && iconMap?.has(categoryId)) {
    return iconMap.get(categoryId) ?? null;
  }
  return null;
}
