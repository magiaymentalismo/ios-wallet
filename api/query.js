import { getState } from "./_lib/state.js";

// Read-only endpoint meant for a third-party app's own "web polling"
// feature (e.g. PeekSmith) to pull from — not the other way around. Shape
// matches what those tools already expect from a generic JSON polling
// source (a top-level "query" field), so it's a drop-in URL: no API key
// needed on their side, since they're the one polling us.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const sessionId = req.query.s;
  const state = await getState(sessionId);
  return res.json({ query: state.secretQuery || "" });
}
