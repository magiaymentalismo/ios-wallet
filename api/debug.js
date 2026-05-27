import { Redis } from "@upstash/redis";

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_KV_REST_API_URL,
    token: process.env.UPSTASH_KV_REST_API_TOKEN,
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  if (req.method === "POST") {
    // Store raw body for inspection
    const redis = getRedis();
    await redis.set("debug:last_body", JSON.stringify(req.body));
    await redis.set("debug:last_headers", JSON.stringify(req.headers));
    return res.json({ ok: true, received: req.body });
  }

  // GET - show last received body
  const redis = getRedis();
  const body = await redis.get("debug:last_body");
  const headers = await redis.get("debug:last_headers");
  return res.json({ last_body: body, last_headers: headers });
}
