import { kv } from "@vercel/kv";

export const DEFAULT_STATE = {
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
    { id: "bbva-1", bank: "BBVA", last4: "1239", color: "from-[#004481] via-[#00a9e0] to-[#004481]", brand: "visa" as const, cardType: "Debit" as const },
    { id: "revolut-1", bank: "Revolut", last4: "0000", color: "from-[#7b4397] via-[#dc2430] to-[#7b4397]", brand: "mastercard" as const, cardType: "Debit" as const },
  ],
  apiResult: "",
  apiLastFetched: "",
  listening: false,
  firstCardLast4: "1239",
};

export function sessionKey(sessionId?: string | null) {
  return sessionId ? `session:${sessionId}` : "session:default";
}

export async function getState(sessionId?: string | null) {
  const state = await kv.get<typeof DEFAULT_STATE>(sessionKey(sessionId));
  return { ...DEFAULT_STATE, ...(state ?? {}) };
}

export async function saveState(state: any, sessionId?: string | null) {
  await kv.set(sessionKey(sessionId), state);
}
