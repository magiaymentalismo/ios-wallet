import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DEFAULT_STATE, sessionKey, getState, saveState } from "../_shared.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.query.s as string | undefined;
  const existing = await getState(sessionId);

  const freshState = {
    ...DEFAULT_STATE,
    ...existing,
    apiResult: "",
    apiLastFetched: "",
    listening: false,
    cards: existing.cards.map((c: any, i: number) => ({
      ...c,
      last4: i === 1 ? "0000" : c.last4,
    })),
  };

  await saveState(freshState, sessionId);
  return res.json({ status: "reset", session: sessionId ?? "default", freshState });
}
