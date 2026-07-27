import { applyUpdates, getState, saveState } from "./_lib/state.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = req.query.s;

  if (req.method === "GET") {
    const state = await getState(sessionId);
    return res.json(state);
  }

  if (req.method === "POST") {
    const updates = req.body ?? {};
    const state = await getState(sessionId);
    const next = applyUpdates(state, updates);
    await saveState(next, sessionId);
    return res.json({ status: "updated", magicState: next });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
