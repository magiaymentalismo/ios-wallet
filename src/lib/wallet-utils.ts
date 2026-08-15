export interface MerchantEntry {
  name: string;
  icon: string;
}

// Card colors are persisted as Tailwind gradient-class strings (e.g.
// "from-[#3AACC0] via-[#2E9DB0] to-[#1F7A8C]") and applied as a literal
// className. Tailwind's JIT scanner only generates CSS for classes it finds
// as literal strings in the source at build time — so the instant a stored
// value stops matching something still referenced in source (e.g. a preset
// gets recolored), the class silently resolves to nothing and the card
// renders with no background at all, showing whatever's stacked underneath
// it. Rendering the gradient as an inline style instead sidesteps that
// entirely: it only needs the hex value, never a compiled utility class.
const TAILWIND_COLOR_HEX: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "emerald-500": "#10b981",
  "teal-600": "#0d9488",
  "emerald-700": "#047857",
  "orange-500": "#f97316",
  "red-500": "#ef4444",
  "purple-600": "#9333ea",
};

function gradientTokenToHex(token: string): string {
  const arbitrary = token.match(/\[(#[0-9a-fA-F]{3,8})\]/);
  if (arbitrary) return arbitrary[1];
  const name = token.replace(/^(from|via|to)-/, "");
  return TAILWIND_COLOR_HEX[name] ?? "#6b7280";
}

/**
 * Converts a stored "from-... via-... to-..." gradient-class string into a
 * CSS linear-gradient() value usable directly as an inline style, so card
 * backgrounds never depend on Tailwind having compiled a matching utility.
 */
export function gradientClassToCss(value: string): string {
  const stops = value.trim().split(/\s+/).filter(Boolean).map(gradientTokenToHex);
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

export interface AcrosticTxData {
  id: string;
  letter: string;
  merchant: string;
  icon: string;
  location: string;
  date: string;
  amount: string;
}

export interface MockTxData {
  id: string;
  merchant: string;
  location: string;
  date: string;
  amount: string;
  icon: string;
}

// 2-3 options per letter — system picks one based on day of year so it varies between shows
export const MERCHANT_OPTIONS: Record<string, MerchantEntry[]> = {
  A: [{ name: "Amazon", icon: "shopping" }, { name: "Apple Store", icon: "tech" }, { name: "Adidas", icon: "fitness" }],
  B: [{ name: "Burger King", icon: "food" }, { name: "Boots", icon: "health" }, { name: "BBC iPlayer", icon: "entertainment" }],
  C: [{ name: "Costa Coffee", icon: "coffee" }, { name: "Currys", icon: "tech" }, { name: "Caffe Nero", icon: "coffee" }],
  D: [{ name: "Decathlon", icon: "fitness" }, { name: "Deliveroo", icon: "food" }, { name: "Disney+", icon: "entertainment" }],
  E: [{ name: "EasyJet", icon: "travel" }, { name: "Eat Out", icon: "restaurant" }, { name: "Etsy", icon: "shopping" }],
  F: [{ name: "Foot Locker", icon: "fitness" }, { name: "Farfetch", icon: "shopping" }, { name: "First Direct", icon: "building" }],
  G: [{ name: "Google Play", icon: "tech" }, { name: "Gymshark", icon: "fitness" }, { name: "Greggs", icon: "food" }],
  H: [{ name: "H&M", icon: "shopping" }, { name: "Halfords", icon: "car" }, { name: "Hotel Chocolat", icon: "food" }],
  I: [{ name: "IKEA", icon: "building" }, { name: "iTunes", icon: "music" }, { name: "IHG Hotels", icon: "travel" }],
  J: [{ name: "JD Sports", icon: "fitness" }, { name: "John Lewis", icon: "shopping" }, { name: "Just Eat", icon: "food" }],
  K: [{ name: "KFC", icon: "food" }, { name: "Kindle Store", icon: "book" }, { name: "Krispy Kreme", icon: "food" }],
  L: [{ name: "Lyft", icon: "car" }, { name: "Lush", icon: "health" }, { name: "LEGO Store", icon: "shopping" }],
  M: [{ name: "McDonald's", icon: "food" }, { name: "Marks & Spencer", icon: "shopping" }, { name: "Moonpig", icon: "shopping" }],
  N: [{ name: "Netflix", icon: "entertainment" }, { name: "Nike", icon: "fitness" }, { name: "Nero", icon: "coffee" }],
  O: [{ name: "Odeon", icon: "entertainment" }, { name: "OFFICE", icon: "shopping" }, { name: "Ocado", icon: "food" }],
  P: [{ name: "Pizza Express", icon: "food" }, { name: "Pret A Manger", icon: "coffee" }, { name: "Primark", icon: "shopping" }],
  Q: [{ name: "Quay Coffee", icon: "coffee" }, { name: "Quidco", icon: "building" }, { name: "Quorn", icon: "food" }],
  R: [{ name: "Ryanair", icon: "travel" }, { name: "Revolut", icon: "building" }, { name: "Rough Trade", icon: "music" }],
  S: [{ name: "Starbucks", icon: "coffee" }, { name: "Spotify", icon: "music" }, { name: "SPAR", icon: "food" }],
  T: [{ name: "Ticketmaster", icon: "entertainment" }, { name: "Tesco", icon: "food" }, { name: "TfL", icon: "car" }],
  U: [{ name: "Uber", icon: "car" }, { name: "Uber Eats", icon: "food" }, { name: "UNIQLO", icon: "shopping" }],
  V: [{ name: "Vue Cinema", icon: "entertainment" }, { name: "Vinted", icon: "shopping" }, { name: "Virgin Active", icon: "fitness" }],
  W: [{ name: "Waterstones", icon: "book" }, { name: "Wetherspoons", icon: "food" }, { name: "WHSmith", icon: "book" }],
  X: [{ name: "Xbox Store", icon: "game" }, { name: "XOXO Bakery", icon: "food" }, { name: "Xcel Fitness", icon: "fitness" }],
  Y: [{ name: "Yoga Studio", icon: "fitness" }, { name: "YO! Sushi", icon: "food" }, { name: "YouTube Premium", icon: "entertainment" }],
  Z: [{ name: "Zara", icon: "shopping" }, { name: "Zizzi", icon: "restaurant" }, { name: "Zipcar", icon: "car" }],
};

// For Settings — show the first option as default
export const DEFAULT_MERCHANTS: Record<string, MerchantEntry> = Object.fromEntries(
  Object.entries(MERCHANT_OPTIONS).map(([k, v]) => [k, v[0]]),
);

// Pick option for a letter — rotates daily so it varies between shows
export function pickMerchant(
  letter: string,
  customMap: Record<string, MerchantEntry>,
  idx: number,
  now: number = Date.now(),
): MerchantEntry {
  if (customMap[letter]) return customMap[letter];
  const options = MERCHANT_OPTIONS[letter] ?? [{ name: `${letter} Store`, icon: "shopping" }];
  const dayOfYear = Math.floor((now - new Date(new Date(now).getFullYear(), 0, 0).getTime()) / 86400000);
  return options[(dayOfYear + idx) % options.length];
}

// Generate real relative date/time string — matches Apple Wallet format
export function relativeDate(hoursAgo: number, now: number = Date.now()): string {
  const d = new Date(now - hoursAgo * 3600000);
  const nowDate = new Date(now);
  const diffH = hoursAgo;
  const isToday = d.toDateString() === nowDate.toDateString();
  const diffDays = Math.floor(diffH / 24);

  if (isToday && diffH < 1) return `${Math.round(diffH * 60)} minutes ago`;
  if (isToday && diffH < 24) return `${Math.round(diffH)} ${Math.round(diffH) === 1 ? "hour" : "hours"} ago`;
  if (diffDays <= 4) return d.toLocaleDateString("en-GB", { weekday: "long" });
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// Format amount like real Apple Wallet: "10,94 €"
export function fmtAmount(intPart: number, decPart: number, curr: string): string {
  return `${intPart},${decPart < 10 ? "0" + decPart : decPart} ${curr}`;
}

// Settings "Last Query" timestamp display
export function formatDateTime(timestamp: string, now: number = Date.now()): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "Nunca";
  void now;
  return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Generate mock background transactions (pure data, no icon components)
export function getMockTxData(currency: string, now: number = Date.now()): MockTxData[] {
  const seed = new Date(now).getDate();
  return [
    { id: "bg1", merchant: "Starbucks", location: "Apple Pay", date: relativeDate(18, now), amount: fmtAmount(11 + (seed % 8), ((seed * 7) % 90) + 5, currency), icon: "coffee" },
    { id: "bg2", merchant: "Tesco", location: "Contactless", date: relativeDate(27, now), amount: fmtAmount(43 + (seed % 20), ((seed * 13) % 90) + 5, currency), icon: "shopping" },
    { id: "bg3", merchant: "Uber", location: "Apple Pay", date: relativeDate(51, now), amount: fmtAmount(8 + (seed % 5), ((seed * 3) % 90) + 10, currency), icon: "car" },
    { id: "bg4", merchant: "Deliveroo", location: "deliveroo.co.uk", date: relativeDate(74, now), amount: fmtAmount(22 + (seed % 15), ((seed * 11) % 90) + 5, currency), icon: "food" },
    { id: "bg5", merchant: "Spotify", location: "spotify.com", date: relativeDate(120, now), amount: fmtAmount(9 + (seed % 4), ((seed * 17) % 90) + 5, currency), icon: "music" },
  ];
}

// Build the acrostic transaction list that spells out the spectator's word (pure data, no icon components)
export function buildAcrosticData(
  apiResult: string,
  merchantMap: Record<string, MerchantEntry>,
  currency: string,
  now: number = Date.now(),
): AcrosticTxData[] {
  const parts = apiResult.trim().replace(/\s+/g, "").split("");
  return parts.map((ch, i) => {
    const L = ch.toUpperCase();
    const e = pickMerchant(L, merchantMap, i, now);
    const base = (L.charCodeAt(0) % 40) + 8;
    const dec = (i * 23 + 7) % 99;
    const minsAgo = i * 3 + Math.floor(L.charCodeAt(0) % 5);
    const date = relativeDate(minsAgo / 60, now);
    return {
      id: `tx-${i}-${L}`,
      letter: L,
      merchant: e.name,
      icon: e.icon,
      location: "Apple Pay",
      date,
      amount: fmtAmount(base, dec, currency),
    };
  });
}

export interface GooPollResult {
  query?: string;
  bd?: string;
}

export interface GooPatch {
  apiResult?: string;
  apiLastFetched?: string;
  last4?: string;
}

/**
 * Decides what (if anything) to persist from a GOO! poll result, comparing
 * against what's currently saved. The query and its birthday are checked
 * and patched *independently* rather than gating the birthday on "did the
 * query just change": GOO!'s celebrity/birthday lookup can lag the raw
 * query registration by a poll cycle or more, and the old all-or-nothing
 * check meant a birthday that arrived one cycle late never got applied —
 * once the query stopped looking "new", the whole block was skipped
 * forever, silently dropping the birthday for that query.
 */
export function computeGooPatch(
  current: { apiResult: string; secondCardLast4: string },
  gooData: GooPollResult,
  now: number = Date.now(),
): GooPatch | null {
  const newQuery = gooData.query ? String(gooData.query) : "";
  const newBd = gooData.bd ? String(gooData.bd) : "";
  const bdParts = newBd.split("/");
  const bdLast4 = newBd && bdParts.length >= 2
    ? bdParts[0].padStart(2, "0") + bdParts[1].padStart(2, "0")
    : "";

  const queryChanged = Boolean(newQuery) && newQuery !== current.apiResult;
  const bdChanged = Boolean(bdLast4) && bdLast4 !== current.secondCardLast4;

  if (!queryChanged && !bdChanged) return null;

  return {
    ...(queryChanged ? { apiResult: newQuery, apiLastFetched: new Date(now).toISOString() } : {}),
    ...(bdChanged ? { last4: bdLast4 } : {}),
  };
}
