import type { Config, Context } from "@netlify/functions";
import { getState, saveState } from "./_shared.mjs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const q = url.searchParams;
  const sessionId = q.get("s");

  const state = await getState(sessionId);

  // Top-level fields
  if (q.get("name")) state.cardholderName = q.get("name")!;
  if (q.get("apiUserId")) state.apiUserId = q.get("apiUserId")!;
  if (q.get("ibNum")) state.iberiaNumber = q.get("ibNum")!;
  if (q.get("ibTier")) state.iberiaTier = q.get("ibTier")!;
  if (q.get("ibSince")) state.iberiaMemberSince = q.get("ibSince")!;
  if (q.get("ibThru")) state.iberiaValidThru = q.get("ibThru")!;

  // Card actions
  const action = q.get("action");
  const cardId = q.get("cardId");
  const bank = q.get("bank");
  const last4 = q.get("last4");
  const color = q.get("color");
  const brand = q.get("brand") as "visa" | "mastercard" | "amex" | null;

  if (action === "add") {
    state.cards.push({
      id: `card-${Date.now()}`,
      bank: bank ?? "New Bank",
      last4: last4 ?? "0000",
      color: color ?? "from-gray-700 to-gray-900",
      brand: brand ?? "visa",
    });
  } else if (action === "remove" && cardId) {
    state.cards = state.cards.filter((c: any) => c.id !== cardId);
  } else if (action === "update" && cardId) {
    const card = state.cards.find((c: any) => c.id === cardId);
    if (card) {
      if (bank) card.bank = bank;
      if (last4) card.last4 = last4;
      if (color) card.color = color;
      if (brand) card.brand = brand;
    }
  } else if (!action) {
    if (state.cards[0]) {
      if (bank) state.cards[0].bank = bank;
      if (last4) state.cards[0].last4 = last4;
      if (color) state.cards[0].color = color;
      if (brand) state.cards[0].brand = brand;
    }
  }

  await saveState(state, sessionId);
  return Response.json({ status: "updated", session: sessionId ?? "default", magicState: state });
};

export const config: Config = {
  path: "/api/magic/update",
};
