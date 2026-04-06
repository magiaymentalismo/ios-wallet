import type { Config, Context } from "@netlify/functions";
import { getMagicStore, DEFAULT_STATE, sessionKey } from "./_shared.mjs";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("s");

  const store = getMagicStore();
  const key = sessionKey(sessionId);
  const existing = await store.get(key, { type: "json" });

  // Merge existing with defaults (so new fields are always present)
  const base = { ...DEFAULT_STATE, ...(existing ?? {}) };

  // ONLY reset spectator data — preserve ALL magician config
  const freshState = {
    ...base,
    apiResult: "",          // clear celebrity name
    listening: false,       // always start inactive
    cards: base.cards.map((c: any, i: number) => ({
      ...c,
      last4: i === 1 ? "0000" : c.last4, // reset birthday card only
    })),
  };

  await store.setJSON(key, freshState);
  return Response.json({ status: "reset", session: sessionId ?? "default", freshState });
};

export const config: Config = {
  path: "/api/magic/reset",
};
