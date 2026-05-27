import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getState, saveState } from "./_shared.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = (req.query.s as string) || "default";

  if (req.method === "POST") {
    // 11q.co sends: {"query": "pedro alonso"} (or whatever key_name is set)
    const body = req.body ?? {};
    const query = String(body.query || body.Query || body.text || body.name || Object.values(body)[0] || "");

    if (query) {
      const state = await getState(sessionId);
      state.apiResult = query;
      state.apiLastFetched = new Date().toISOString();
      await saveState(state, sessionId);
      return res.json({ ok: true, received: query });
    }
    return res.json({ ok: false, error: "no query found", body });
  }

  if (req.method === "GET") {
    const state = await getState(sessionId);
    return res.json({ apiResult: state.apiResult, apiLastFetched: state.apiLastFetched });
  }

  return res.status(405).json({ error: "method not allowed" });
}
