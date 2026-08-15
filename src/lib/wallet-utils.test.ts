import { describe, expect, it } from "vitest";
import {
  DEFAULT_MERCHANTS,
  MERCHANT_OPTIONS,
  buildAcrosticData,
  computeGooPatch,
  fmtAmount,
  formatDateTime,
  getMockTxData,
  gradientClassToCss,
  pickMerchant,
  relativeDate,
} from "./wallet-utils";

describe("computeGooPatch", () => {
  const now = new Date("2026-07-27T12:00:00Z").getTime();

  it("returns null when nothing changed", () => {
    const current = { apiResult: "lionel messi", secondCardLast4: "2406" };
    expect(computeGooPatch(current, { query: "lionel messi", bd: "24/06/1987" }, now)).toBeNull();
  });

  it("patches apiResult alone when the query changes but no birthday is present yet", () => {
    const current = { apiResult: "", secondCardLast4: "0000" };
    const patch = computeGooPatch(current, { query: "lionel messi", bd: "" }, now);
    expect(patch).toEqual({ apiResult: "lionel messi", apiLastFetched: new Date(now).toISOString() });
  });

  it("patches last4 alone when the birthday arrives on a later poll, after the query already matched", () => {
    // Regression case: the query was already saved on a previous cycle: bd
    // showed up late. The old logic gated this entirely on "query changed"
    // and would've silently dropped the birthday forever.
    const current = { apiResult: "lionel messi", secondCardLast4: "0000" };
    const patch = computeGooPatch(current, { query: "lionel messi", bd: "24/06/1987" }, now);
    expect(patch).toEqual({ last4: "2406" });
  });

  it("patches both together when the query and birthday arrive in the same poll", () => {
    const current = { apiResult: "", secondCardLast4: "0000" };
    const patch = computeGooPatch(current, { query: "lionel messi", bd: "24/06/1987" }, now);
    expect(patch).toEqual({
      apiResult: "lionel messi",
      apiLastFetched: new Date(now).toISOString(),
      last4: "2406",
    });
  });

  it("ignores a malformed birthday instead of crashing", () => {
    const current = { apiResult: "x", secondCardLast4: "0000" };
    expect(computeGooPatch(current, { query: "x", bd: "not-a-date" }, now)).toBeNull();
  });

  it("does not re-patch last4 once it already matches, even if apiResult is stale for other reasons", () => {
    const current = { apiResult: "old query", secondCardLast4: "2406" };
    const patch = computeGooPatch(current, { query: "old query", bd: "24/06/1987" }, now);
    expect(patch).toBeNull();
  });
});

describe("gradientClassToCss", () => {
  it("extracts arbitrary hex stops regardless of whether Tailwind compiled the class", () => {
    expect(gradientClassToCss("from-[#3AACC0] via-[#2E9DB0] to-[#1F7A8C]"))
      .toBe("linear-gradient(135deg, #3AACC0, #2E9DB0, #1F7A8C)");
  });

  it("resolves named Tailwind palette colors used by the built-in presets", () => {
    expect(gradientClassToCss("from-gray-900 via-gray-800 to-black"))
      .toBe("linear-gradient(135deg, #111827, #1f2937, #000000)");
  });

  it("handles a 2-stop gradient (from/to, no via)", () => {
    expect(gradientClassToCss("from-gray-700 to-gray-900"))
      .toBe("linear-gradient(135deg, #374151, #111827)");
  });

  it("falls back to a neutral gray for an unrecognized named color, instead of dropping the stop", () => {
    expect(gradientClassToCss("from-cyan-500 to-cyan-700"))
      .toBe("linear-gradient(135deg, #6b7280, #6b7280)");
  });

  it("is stable for any stored value regardless of what's currently in the GRADIENTS preset list", () => {
    // Regression guard: this exact string was a real preset value that later
    // got recolored, silently breaking any already-persisted card that
    // still referenced it (the class stopped being compiled by Tailwind).
    expect(gradientClassToCss("from-[#7b4397] via-[#dc2430] to-[#7b4397]"))
      .toBe("linear-gradient(135deg, #7b4397, #dc2430, #7b4397)");
  });
});

describe("relativeDate", () => {
  const now = new Date("2026-07-27T12:00:00Z").getTime();

  it("formats sub-hour gaps as 'X minutes ago'", () => {
    expect(relativeDate(0.5, now)).toBe("30 minutes ago");
  });

  it("formats same-day gaps as singular/plural hours ago", () => {
    expect(relativeDate(1, now)).toBe("1 hour ago");
    expect(relativeDate(3, now)).toBe("3 hours ago");
  });

  it("formats gaps within 4 days as a weekday name", () => {
    const result = relativeDate(48, now);
    expect(result).toBe(new Date(now - 48 * 3600000).toLocaleDateString("en-GB", { weekday: "long" }));
  });

  it("formats older gaps as d/m/yy", () => {
    const hoursAgo = 24 * 10;
    const d = new Date(now - hoursAgo * 3600000);
    const expected = `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    expect(relativeDate(hoursAgo, now)).toBe(expected);
  });
});

describe("fmtAmount", () => {
  it("pads single-digit decimals with a leading zero", () => {
    expect(fmtAmount(10, 5, "£")).toBe("10,05 £");
  });

  it("leaves two-digit decimals untouched", () => {
    expect(fmtAmount(10, 94, "€")).toBe("10,94 €");
  });
});

describe("formatDateTime", () => {
  it("returns 'Nunca' for an invalid/empty timestamp", () => {
    expect(formatDateTime("")).toBe("Nunca");
    expect(formatDateTime("not a date")).toBe("Nunca");
  });

  it("formats a valid ISO timestamp", () => {
    const iso = "2026-07-27T12:34:00.000Z";
    expect(formatDateTime(iso)).toBe(new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
    }));
  });
});

describe("pickMerchant", () => {
  const now = new Date("2026-07-27T12:00:00Z").getTime();

  it("prefers a custom mapping for the letter when present", () => {
    const custom = { A: { name: "Custom Amazon", icon: "shopping" } };
    expect(pickMerchant("A", custom, 0, now)).toEqual({ name: "Custom Amazon", icon: "shopping" });
  });

  it("falls back to the built-in rotation when no custom mapping exists", () => {
    const result = pickMerchant("A", {}, 0, now);
    expect(MERCHANT_OPTIONS.A).toContainEqual(result);
  });

  it("is deterministic for a fixed day and index", () => {
    expect(pickMerchant("S", {}, 2, now)).toEqual(pickMerchant("S", {}, 2, now));
  });
});

describe("DEFAULT_MERCHANTS", () => {
  it("has one entry per letter A-Z, matching each letter's first option", () => {
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      expect(DEFAULT_MERCHANTS[letter]).toEqual(MERCHANT_OPTIONS[letter][0]);
    }
  });
});

describe("getMockTxData", () => {
  const now = new Date("2026-07-27T12:00:00Z").getTime();

  it("returns 5 fixed background transactions", () => {
    expect(getMockTxData("£", now)).toHaveLength(5);
  });

  it("is deterministic for a fixed timestamp", () => {
    expect(getMockTxData("€", now)).toEqual(getMockTxData("€", now));
  });
});

describe("buildAcrosticData", () => {
  const now = new Date("2026-07-27T12:00:00Z").getTime();

  it("produces one transaction per letter of the spectator's word", () => {
    const txs = buildAcrosticData("HELLO", {}, "£", now);
    expect(txs.map((t) => t.letter)).toEqual(["H", "E", "L", "L", "O"]);
  });

  it("strips whitespace and uppercases before spelling", () => {
    const txs = buildAcrosticData("hi there", {}, "£", now);
    expect(txs.map((t) => t.letter).join("")).toBe("HITHERE");
  });

  it("uses the custom merchant map when provided", () => {
    const txs = buildAcrosticData("A", { A: { name: "Custom A", icon: "tech" } }, "£", now);
    expect(txs[0]).toMatchObject({ merchant: "Custom A", icon: "tech" });
  });

  it("returns an empty array for an empty result", () => {
    expect(buildAcrosticData("", {}, "£", now)).toEqual([]);
  });

  it("gives every transaction a unique id even with repeated letters", () => {
    const txs = buildAcrosticData("HELLO", {}, "£", now);
    expect(new Set(txs.map((t) => t.id)).size).toBe(txs.length);
  });
});
