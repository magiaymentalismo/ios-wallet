import { getState, parseWebhookPayload, saveState } from "./_lib/state.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = req.query.s || "default";

  if (req.method === "POST") {
    const body = req.body ?? {};
    console.log("webhook received:", JSON.stringify(body));

    const { name, birthday, last4 } = parseWebhookPayload(body);

    if (!name && !last4) {
      return res.json({ ok: false, error: "could not parse payload", body });
    }

    const state = await getState(sessionId);

    if (name) state.apiResult = name;
    state.apiLastFetched = new Date().toISOString();

    if (last4 && state.cards && state.cards[1]) {
      state.cards[1].last4 = last4;
    }

    await saveState(state, sessionId);
    return res.json({ ok: true, name, birthday, last4 });
  }

  if (req.method === "GET") {
    const state = await getState(sessionId);
    return res.json({
      apiResult: state.apiResult || "",
      apiLastFetched: state.apiLastFetched || "",
      cardLast4: state.cards?.[1]?.last4 || "",
    });
  }

  return res.status(405).json({ error: "method not allowed" });
}
