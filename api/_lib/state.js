import { Redis } from "@upstash/redis";

export const DEFAULT_STATE = {
  apiUserId: "131", currency: "£", merchantMap: {},
  loyaltyName: "IBERIA", loyaltySubtitle: "PLUS", loyaltyColor: "#D7192D",
  loyaltyFieldLabel: "IBERIA PLUS NUMBER", cardholderName: "ARIEL hamui",
  iberiaNumber: "IB 125900928", iberiaTier: "PLATA",
  iberiaMemberSince: "04/24", iberiaValidThru: "04/26",
  cards: [
    { id: "bbva-1", bank: "BBVA", last4: "1239", color: "from-[#004481] via-[#00a9e0] to-[#004481]", brand: "visa", cardType: "Debit" },
    { id: "revolut-1", bank: "Revolut", last4: "0000", color: "from-[#7b4397] via-[#dc2430] to-[#7b4397]", brand: "mastercard", cardType: "Debit" },
  ],
  apiResult: "", apiLastFetched: "", listening: false, firstCardLast4: "1239",
};

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
    return { ...DEFAULT_STATE, ...(state ?? {}) };
  } catch {
    return { ...DEFAULT_STATE };
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
