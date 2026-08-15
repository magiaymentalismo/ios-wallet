import { Redis } from "@upstash/redis";

export const DEFAULT_STATE = {
  apiUserId: "131", currency: "£", merchantMap: {},
  loyaltyName: "IBERIA", loyaltySubtitle: "PLUS", loyaltyColor: "#D7192D",
  loyaltyFieldLabel: "IBERIA PLUS NUMBER", cardholderName: "ARIEL hamui",
  iberiaNumber: "IB 125900928", iberiaTier: "PLATA",
  iberiaMemberSince: "04/24", iberiaValidThru: "04/26",
  cards: [
    { id: "bbva-1", bank: "BBVA", last4: "1239", color: "from-[#3AACC0] via-[#2E9DB0] to-[#1F7A8C]", brand: "visa", cardType: "Debit" },
    { id: "revolut-1", bank: "Revolut", last4: "0000", color: "from-[#6D3FC4] via-[#4B4CD1] to-[#2E5FE8]", brand: "mastercard", cardType: "Debit" },
  ],
  apiResult: "", apiLastFetched: "", listening: false, firstCardLast4: "1239",
  // Last value the performer secretly entered (currently: the hidden
  // 4-digit grid on the Iberia card). Exposed via GET /api/query as
  // {"query": "..."} so a third-party app's own "web polling" feature
  // (e.g. PeekSmith) can pull it without us needing any API key on their
  // side — they poll us, we don't call them.
  secretQuery: "",
  // Generalized list of poll sources (GOO!, InjectID/11z.co, or any custom
  // URL) — see ensureGooSource() below for how this stays compatible with
  // sessions saved before this field existed.
  sources: [],
};

/**
 * Older saved sessions predate `sources` and only have the legacy
 * apiUserId/listening fields. Rather than migrating stored data, synthesize
 * an equivalent "goo" source on read so nothing already configured in
 * production is lost. No-ops once a real sources array has been saved.
 */
export function ensureGooSource(state) {
  if (Array.isArray(state.sources) && state.sources.length > 0) return state;
  return {
    ...state,
    sources: [
      {
        id: "goo-default",
        type: "goo",
        name: "GOO!",
        key: state.apiUserId ?? "",
        url: "",
        field: "",
        destination: "card",
        cardId: state.cards?.[1]?.id ?? "",
        active: Boolean(state.listening),
      },
    ],
  };
}

let redisClient = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_KV_REST_API_URL,
      token: process.env.UPSTASH_KV_REST_API_TOKEN,
    });
  }
  return redisClient;
}

export function sessionKey(sessionId) {
  return sessionId ? `session:${sessionId}` : "session:default";
}

export async function getState(sessionId) {
  try {
    const state = await getRedis().get(sessionKey(sessionId));
    return ensureGooSource({ ...DEFAULT_STATE, ...(state ?? {}) });
  } catch {
    return ensureGooSource({ ...DEFAULT_STATE });
  }
}

export async function saveState(state, sessionId) {
  try {
    await getRedis().set(sessionKey(sessionId), state);
  } catch (e) {
    console.error(e);
  }
}

const STRING_FIELD_ALIASES = {
  cardholderName: ["cardholderName", "name"],
  apiUserId: ["apiUserId"],
  iberiaNumber: ["iberiaNumber", "ibNum"],
  iberiaTier: ["iberiaTier", "ibTier"],
  iberiaMemberSince: ["iberiaMemberSince", "ibSince"],
  iberiaValidThru: ["iberiaValidThru", "ibThru"],
  currency: ["currency"],
  loyaltyName: ["loyaltyName"],
  loyaltySubtitle: ["loyaltySubtitle"],
  loyaltyColor: ["loyaltyColor"],
  loyaltyFieldLabel: ["loyaltyFieldLabel"],
  apiResult: ["apiResult"],
  apiLastFetched: ["apiLastFetched"],
  secretQuery: ["secretQuery"],
};

/**
 * Pure state-transition function: given the current state and a patch of
 * updates (in the shape the frontend/webhook send), returns a new state.
 * Does not mutate its inputs, so it can be exercised directly in tests
 * without touching Redis.
 */
export function applyUpdates(state, updates = {}) {
  const next = { ...state, cards: state.cards.map((c) => ({ ...c })) };

  // When both an alias and its canonical field are present, the last one
  // listed wins — matches the original handler's sequential overwrite order.
  for (const [field, aliases] of Object.entries(STRING_FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (updates[alias] !== undefined) next[field] = updates[alias];
    }
  }

  if (updates.listening !== undefined) next.listening = Boolean(updates.listening);
  if (updates.merchantMap !== undefined) {
    next.merchantMap = { ...(state.merchantMap ?? {}), ...updates.merchantMap };
  }

  // Full replacement: the Settings "Conectores" tab always sends the whole
  // list back (add/edit/delete/toggle all go through the same save).
  if (updates.sources !== undefined) next.sources = updates.sources;

  // Bulk per-card last4 patch, keyed by card id — used by the poll loop
  // when multiple active sources land in the same cycle and each targets a
  // different card. Independent of the single-card `action: "update"`
  // path below, which the Settings UI's manual card editor still uses.
  if (updates.cardLast4Updates && typeof updates.cardLast4Updates === "object") {
    next.cards = next.cards.map((c) =>
      updates.cardLast4Updates[c.id] !== undefined ? { ...c, last4: updates.cardLast4Updates[c.id] } : c,
    );
  }

  if (updates.action === "add") {
    next.cards = [
      ...next.cards,
      {
        id: `card-${Date.now()}`,
        bank: updates.bank ?? "New Bank",
        last4: "0000",
        color: updates.color ?? "from-gray-700 to-gray-900",
        brand: updates.brand ?? "visa",
        cardType: updates.cardType ?? "Debit",
      },
    ];
  } else if (updates.action === "remove" && updates.cardId) {
    next.cards = next.cards.filter((c) => c.id !== updates.cardId);
  } else if (updates.action === "update" && updates.cardId) {
    next.cards = next.cards.map((c) => {
      if (c.id !== updates.cardId) return c;
      return {
        ...c,
        ...(updates.bank !== undefined && { bank: updates.bank }),
        ...(updates.last4 !== undefined && { last4: updates.last4 }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.brand !== undefined && { brand: updates.brand }),
        ...(updates.cardType !== undefined && { cardType: updates.cardType }),
      };
    });
  }

  return next;
}

/** Reset the per-spectator fields, keeping the magician's configuration. */
export function resetForNewSpectator(state) {
  return {
    ...state,
    apiResult: "",
    apiLastFetched: "",
    listening: false,
    // Deactivate every source (GOO!, InjectID, custom) but keep their
    // configuration — same "off between shows, configured once" pattern
    // as the legacy `listening` flag above.
    sources: (state.sources ?? []).map((s) => ({ ...s, active: false })),
    cards: (state.cards ?? DEFAULT_STATE.cards).map((c, i) => ({
      ...c,
      last4: i === 1 ? "0000" : c.last4,
    })),
  };
}

/** Parse the payload 11q.co's webhook sends, in any of its known shapes. */
export function parseWebhookPayload(body) {
  const query = body.query || body.Query || body.name || "";
  const bd = body.bd || body.birthday || body.date || "";
  const combined = body.combined || body.text || "";

  let name = query;
  let birthday = bd;

  if (!name && combined) {
    const match = combined.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      name = match[1].trim();
      birthday = match[2];
    } else {
      name = combined;
    }
  }

  if (!name && !birthday) {
    const val = String(Object.values(body)[0] || "");
    const match = val.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})/);
    if (match) {
      name = match[1].trim();
      birthday = match[2];
    } else {
      name = val;
    }
  }

  let last4 = null;
  if (birthday) {
    const parts = birthday.split("/");
    if (parts.length >= 2) {
      last4 = parts[0].padStart(2, "0") + parts[1].padStart(2, "0");
    }
  }

  return { name, birthday, last4 };
}
