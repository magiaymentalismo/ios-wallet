import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  applyUpdates,
  getState,
  parseWebhookPayload,
  resetForNewSpectator,
  saveState,
  sessionKey,
} from "./state.js";

describe("sessionKey", () => {
  it("namespaces a given session id", () => {
    expect(sessionKey("abc123")).toBe("session:abc123");
  });

  it("falls back to the default session when none is given", () => {
    expect(sessionKey(undefined)).toBe("session:default");
    expect(sessionKey("")).toBe("session:default");
    expect(sessionKey(null)).toBe("session:default");
  });
});

describe("getState / saveState without Redis credentials configured", () => {
  it("getState falls back to defaults instead of throwing", async () => {
    const state = await getState(`test-${Math.random()}`);
    expect(state).toEqual(DEFAULT_STATE);
  });

  it("saveState does not throw even though persistence fails", async () => {
    await expect(saveState(DEFAULT_STATE, `test-${Math.random()}`)).resolves.toBeUndefined();
  });
});

describe("applyUpdates", () => {
  it("does not mutate the input state", () => {
    const before = JSON.parse(JSON.stringify(DEFAULT_STATE));
    applyUpdates(DEFAULT_STATE, { cardholderName: "Changed" });
    expect(DEFAULT_STATE).toEqual(before);
  });

  it("prefers the short-form alias over the long-form field when both are sent", () => {
    // Mirrors the original handler's sequential overwrite: `name` was applied
    // after `cardholderName`, so it wins when both are present in one patch.
    const next = applyUpdates(DEFAULT_STATE, { cardholderName: "Long Form", name: "Short Form" });
    expect(next.cardholderName).toBe("Short Form");

    const next2 = applyUpdates(DEFAULT_STATE, { iberiaNumber: "IB1", ibNum: "IB2" });
    expect(next2.iberiaNumber).toBe("IB2");
  });

  it("accepts the long-form field alone", () => {
    const next = applyUpdates(DEFAULT_STATE, { cardholderName: "Solo Long" });
    expect(next.cardholderName).toBe("Solo Long");
  });

  it("sets secretQuery, the value exposed read-only via GET /api/query", () => {
    const next = applyUpdates(DEFAULT_STATE, { secretQuery: "1234" });
    expect(next.secretQuery).toBe("1234");
    expect(DEFAULT_STATE.secretQuery).toBe(""); // input untouched
  });

  it("toggles listening as a boolean", () => {
    expect(applyUpdates(DEFAULT_STATE, { listening: true }).listening).toBe(true);
    expect(applyUpdates({ ...DEFAULT_STATE, listening: true }, { listening: false }).listening).toBe(false);
  });

  it("merges merchantMap instead of replacing it", () => {
    const withA = applyUpdates(DEFAULT_STATE, { merchantMap: { A: { name: "A Store", icon: "shopping" } } });
    const withB = applyUpdates(withA, { merchantMap: { B: { name: "B Store", icon: "food" } } });
    expect(withB.merchantMap).toEqual({
      A: { name: "A Store", icon: "shopping" },
      B: { name: "B Store", icon: "food" },
    });
  });

  it("adds a new card with action: add", () => {
    const next = applyUpdates(DEFAULT_STATE, { action: "add", bank: "New Bank" });
    expect(next.cards).toHaveLength(3);
    expect(next.cards[2]).toMatchObject({ bank: "New Bank", last4: "0000", brand: "visa", cardType: "Debit" });
  });

  it("removes a card by id with action: remove", () => {
    const targetId = DEFAULT_STATE.cards[0].id;
    const next = applyUpdates(DEFAULT_STATE, { action: "remove", cardId: targetId });
    expect(next.cards).toHaveLength(1);
    expect(next.cards.find((c) => c.id === targetId)).toBeUndefined();
  });

  it("updates fields on an existing card with action: update, leaving others untouched", () => {
    const targetId = DEFAULT_STATE.cards[0].id;
    const next = applyUpdates(DEFAULT_STATE, { action: "update", cardId: targetId, bank: "Renamed", last4: "0007" });
    expect(next.cards[0]).toMatchObject({ bank: "Renamed", last4: "0007" });
    expect(next.cards[1]).toEqual(DEFAULT_STATE.cards[1]);
  });

  it("ignores unrelated fields left undefined in the patch", () => {
    const next = applyUpdates(DEFAULT_STATE, {});
    expect(next).toEqual(DEFAULT_STATE);
  });
});

describe("resetForNewSpectator", () => {
  it("clears spectator-specific fields but keeps magician configuration", () => {
    const dirty = {
      ...DEFAULT_STATE,
      apiResult: "SECRET WORD",
      apiLastFetched: "2026-07-27T12:00:00.000Z",
      listening: true,
      apiUserId: "999",
      cards: [
        { ...DEFAULT_STATE.cards[0], last4: "1111" },
        { ...DEFAULT_STATE.cards[1], last4: "2222" },
      ],
    };

    const fresh = resetForNewSpectator(dirty);
    expect(fresh.apiResult).toBe("");
    expect(fresh.apiLastFetched).toBe("");
    expect(fresh.listening).toBe(false);
    expect(fresh.apiUserId).toBe("999"); // configuration persists
    expect(fresh.cards[0].last4).toBe("1111"); // first card is untouched by reset
    expect(fresh.cards[1].last4).toBe("0000"); // second card always resets to placeholder
  });
});

describe("parseWebhookPayload", () => {
  it("reads an explicit {query, bd} payload", () => {
    expect(parseWebhookPayload({ query: "Antonio Banderas", bd: "10/08/1960" })).toEqual({
      name: "Antonio Banderas",
      birthday: "10/08/1960",
      last4: "1008",
    });
  });

  it("accepts the Query/name/birthday/date aliases", () => {
    expect(parseWebhookPayload({ name: "Ana", birthday: "05/09/1990" })).toMatchObject({ name: "Ana", last4: "0509" });
    expect(parseWebhookPayload({ Query: "Ana", date: "05/09/1990" })).toMatchObject({ name: "Ana", last4: "0509" });
  });

  it("parses a combined 'name DD/MM/YYYY ...' string", () => {
    const result = parseWebhookPayload({ combined: "Antonio Banderas 10/08/1960 24,031 days" });
    expect(result).toEqual({ name: "Antonio Banderas", birthday: "10/08/1960", last4: "1008" });
  });

  it("falls back to the first value in the body when no known key matches", () => {
    const result = parseWebhookPayload({ whatever: "Someone Else 01/01/2000" });
    expect(result).toEqual({ name: "Someone Else", birthday: "01/01/2000", last4: "0101" });
  });

  it("returns a null last4 when no parseable birthday is present", () => {
    const result = parseWebhookPayload({ query: "Just A Name" });
    expect(result.name).toBe("Just A Name");
    expect(result.last4).toBeNull();
  });
});
