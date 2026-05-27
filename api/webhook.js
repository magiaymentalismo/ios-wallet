const { Redis } = require("@upstash/redis");

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_KV_REST_API_URL,
    token: process.env.UPSTASH_KV_REST_API_TOKEN,
  });
}

function sessionKey(sessionId) {
  return sessionId ? `session:${sessionId}` : "session:default";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = req.query.s || "default";
  const key = sessionKey(sessionId);

  if (req.method === "POST") {
    const body = req.body ?? {};
    const query = String(body.query || body.Query || body.text || body.name || Object.values(body)[0] || "");
    if (query) {
      const redis = getRedis();
      let state = await redis.get(key) ?? {};
      state.apiResult = query;
      state.apiLastFetched = new Date().toISOString();
      await redis.set(key, state);
      return res.json({ ok: true, received: query });
    }
    return res.json({ ok: false, error: "no query found", body });
  }

  if (req.method === "GET") {
    const redis = getRedis();
    const state = await redis.get(key) ?? {};
    return res.json({ apiResult: state.apiResult || "", apiLastFetched: state.apiLastFetched || "" });
  }

  return res.status(405).json({ error: "method not allowed" });
};
