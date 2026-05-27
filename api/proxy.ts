import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "missing userId" });

  try {
    const r = await fetch(`https://11q.co/pro-api/${userId}/last-bd`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://11q.co/",
        "Origin": "https://11q.co",
      }
    });
    const text = await r.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
