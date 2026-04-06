import { getStore } from "@netlify/blobs";

export const STORE_KEY = "state";

// Fields split into two categories:
// MAGICIAN CONFIG — never cleared on reset
// SPECTATOR DATA  — cleared on every reset

export const DEFAULT_STATE = {
  // Magician config
  apiUserId: "131",
  currency: "£",
  merchantMap: {} as Record<string, { name: string; icon: string }>,
  loyaltyName: "IBERIA",
  loyaltySubtitle: "PLUS",
  loyaltyColor: "#D7192D",
  loyaltyFieldLabel: "IBERIA PLUS NUMBER",
  cardholderName: "ARIEL hamui",
  iberiaNumber: "IB 125900928",
  iberiaTier: "PLATA",
  iberiaMemberSince: "04/24",
  iberiaValidThru: "04/26",
  cards: [
    { id: "bbva-1", bank: "BBVA", last4: "1239", color: "from-[#004481] via-[#00a9e0] to-[#004481]", brand: "visa" as "visa"|"mastercard"|"amex", cardType: "Debit" as "Debit"|"Credit" },
    { id: "revolut-1", bank: "Revolut", last4: "0000", color: "from-[#7b4397] via-[#dc2430] to-[#7b4397]", brand: "mastercard" as "visa"|"mastercard"|"amex", cardType: "Debit" as "Debit"|"Credit" },
  ],
  // Spectator data (reset each show)
  apiResult: "",
  listening: false,
  firstCardLast4: "1239",
};

export const SPECTATOR_FIELDS = ["apiResult", "listening"] as const;

export function getMagicStore() {
  return getStore({ name: "magic-state", consistency: "strong" });
}

export function sessionKey(sessionId?: string | null) {
  return sessionId ? `session-${sessionId}` : "state";
}

export async function getState(sessionId?: string | null) {
  const store = getMagicStore();
  const state = await store.get(sessionKey(sessionId), { type: "json" });
  // Merge with defaults so new fields are always present
  return { ...DEFAULT_STATE, ...(state ?? {}) };
}

export async function saveState(state: any, sessionId?: string | null) {
  const store = getMagicStore();
  await store.setJSON(sessionKey(sessionId), state);
}
