import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getState, saveState } from "../_shared.js";

async function refreshFromExternalApi(state: any) {
  if (!state.listening) return { state, changed: false };
  try {
    const res = await fetch(`https://11q.co/pro-api/${state.apiUserId}/last-bd`);
    if (!res.ok) return { state, changed: false };
    const data = await res.json();
    let changed = false;
    if (data.query && String(data.query) !== state.apiResult) {
      state.apiResult = String(data.query);
      changed = true;
    }
    if (data.bd && state.cards[1]) {
      const parts = String(data.bd).split("/");
      if (parts.length >= 2) {
        const newLast4 = parts[0].padStart(2, "0") + parts[1].padStart(2, "0");
        if (state.cards[1].last4 !== newLast4) {
          state.cards[1].last4 = newLast4;
          changed = true;
        }
      }
    }
    return { state, changed };
  } catch {
    return { state, changed: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.query.s as string | undefined;

  if (req.method === "GET") {
    const state = await getState(sessionId);
    const { state: refreshed, changed } = await refreshFromExternalApi(state);
    if (changed) await saveState(refreshed, sessionId);
    return res.json(refreshed);
  }

  if (req.method === "POST") {
    const updates = req.body;
    const state = await getState(sessionId);

    if (updates.cardholderName !== undefined) state.cardholderName = updates.cardholderName;
    if (updates.name !== undefined) state.cardholderName = updates.name;
    if (updates.apiUserId !== undefined) state.apiUserId = updates.apiUserId;
    if (updates.iberiaNumber !== undefined) state.iberiaNumber = updates.iberiaNumber;
    if (updates.ibNum !== undefined) state.iberiaNumber = updates.ibNum;
    if (updates.iberiaTier !== undefined) state.iberiaTier = updates.iberiaTier;
    if (updates.ibTier !== undefined) state.iberiaTier = updates.ibTier;
    if (updates.iberiaMemberSince !== undefined) state.iberiaMemberSince = updates.iberiaMemberSince;
    if (updates.ibSince !== undefined) state.iberiaMemberSince = updates.ibSince;
    if (updates.iberiaValidThru !== undefined) state.iberiaValidThru = updates.iberiaValidThru;
    if (updates.ibThru !== undefined) state.iberiaValidThru = updates.ibThru;
    if (updates.currency !== undefined) state.currency = updates.currency;
    if (updates.merchantMap !== undefined) state.merchantMap = { ...(state.merchantMap ?? {}), ...updates.merchantMap };
    if (updates.loyaltyName !== undefined) state.loyaltyName = updates.loyaltyName;
    if (updates.loyaltySubtitle !== undefined) state.loyaltySubtitle = updates.loyaltySubtitle;
    if (updates.loyaltyColor !== undefined) state.loyaltyColor = updates.loyaltyColor;
    if (updates.loyaltyFieldLabel !== undefined) state.loyaltyFieldLabel = updates.loyaltyFieldLabel;
    if (updates.listening !== undefined) state.listening = updates.listening;
    if (updates.firstCardLast4 !== undefined) state.firstCardLast4 = updates.firstCardLast4;

    if (updates.action === "add") {
      state.cards.push({ id: `card-${Date.now()}`, bank: updates.bank ?? "New Bank", last4: "0000", color: updates.color ?? "from-gray-700 to-gray-900", brand: updates.brand ?? "visa", cardType: updates.cardType ?? "Debit" });
    } else if (updates.action === "remove" && updates.cardId) {
      state.cards = state.cards.filter((c: any) => c.id !== updates.cardId);
    } else if (updates.action === "update" && updates.cardId) {
      const card = state.cards.find((c: any) => c.id === updates.cardId);
      if (card) {
        if (updates.bank !== undefined) card.bank = updates.bank;
        if (updates.last4 !== undefined) card.last4 = updates.last4;
        if (updates.color !== undefined) card.color = updates.color;
        if (updates.brand !== undefined) card.brand = updates.brand;
        if (updates.cardType !== undefined) card.cardType = updates.cardType;
      }
    }

    await saveState(state, sessionId);
    return res.json({ status: "updated", magicState: state });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
