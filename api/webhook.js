import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_KV_REST_API_URL,
    token: process.env.UPSTASH_KV_REST_API_TOKEN,
  });
}

function sessionKey(id) { return id ? `session:${id}` : "session:default"; }

// Parse "antonio banderas 10/08/1960 24,031 days" or {"query":"antonio banderas","bd":"10/08/1960"}
function parsePayload(body) {
  // If body has explicit fields
  const query = body.query || body.Query || body.name || "";
  const bd = body.bd || body.birthday || body.date || "";
  const combined = body.combined || body.text || "";

  let name = query;
  let birthday = bd;

  // Try to parse from combined string: "name DD/MM/YYYY ..."
  if (!name && combined) {
    const match = combined.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})/);
    if (match) { name = match[1].trim(); birthday = match[2]; }
    else name = combined;
  }

  // If we got combined as the query key
  if (!name && !birthday) {
    const val = String(Object.values(body)[0] || "");
    const match = val.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})/);
    if (match) { name = match[1].trim(); birthday = match[2]; }
    else name = val;
  }

  // Parse birthday DD/MM/YYYY → last4 = DDMM
  let last4 = null;
  if (birthday) {
    const parts = birthday.split("/");
    if (parts.length >= 2) {
      last4 = parts[0].padStart(2,"0") + parts[1].padStart(2,"0");
    }
  }

  return { name, birthday, last4 };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = req.query.s || "default";
  const key = sessionKey(sessionId);

  if (req.method === "POST") {
    const body = req.body ?? {};
    console.log("webhook received:", JSON.stringify(body));

    const { name, birthday, last4 } = parsePayload(body);

    if (!name && !last4) {
      return res.json({ ok: false, error: "could not parse payload", body });
    }

    const redis = getRedis();
    const state = await redis.get(key) ?? {};

    if (name) state.apiResult = name;
    state.apiLastFetched = new Date().toISOString();

    // Update second card last4 with birthday DDMM
    if (last4 && state.cards && state.cards[1]) {
      state.cards[1].last4 = last4;
    }

    await redis.set(key, state);
    return res.json({ ok: true, name, birthday, last4 });
  }

  if (req.method === "GET") {
    const redis = getRedis();
    const state = await redis.get(key) ?? {};
    return res.json({
      apiResult: state.apiResult || "",
      apiLastFetched: state.apiLastFetched || "",
      cardLast4: state.cards?.[1]?.last4 || ""
    });
  }

  return res.status(405).json({ error: "method not allowed" });
}
