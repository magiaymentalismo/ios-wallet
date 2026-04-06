import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel cron calls this — verify it's from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const keys = await kv.keys("session:*");
    for (const key of keys) {
      const state = await kv.get<any>(key);
      if (!state?.listening) continue;
      try {
        const r = await fetch(`https://11q.co/pro-api/${state.apiUserId}/last-bd`);
        if (!r.ok) continue;
        const data = await r.json();
        let changed = false;
        if (data.query && String(data.query) !== state.apiResult) { state.apiResult = String(data.query); changed = true; }
        if (data.bd && state.cards[1]) {
          const parts = String(data.bd).split("/");
          if (parts.length >= 2) {
            const newLast4 = parts[0].padStart(2,"0") + parts[1].padStart(2,"0");
            if (state.cards[1].last4 !== newLast4) { state.cards[1].last4 = newLast4; changed = true; }
          }
        }
        if (changed) await kv.set(key, state);
      } catch {}
    }
    return res.json({ status: "ok", polled: keys.length });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
