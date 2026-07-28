// Server-side proxy for the GOO! (11q.co) lookup API.
//
// Runs on Vercel's Edge runtime rather than Node serverless: Cloudflare
// (which fronts 11q.co) challenges/blocks Vercel's Node serverless IP
// ranges with a 403, but the Edge runtime egresses through a different
// pool that may not be flagged. If this doesn't hold up, the fallback is
// a relay hosted outside Vercel entirely.
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "missing userId" }, { status: 400 });
  }

  try {
    const r = await fetch(`https://11q.co/pro-api/${userId}/last-bd`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Referer: "https://11q.co/",
        Origin: "https://11q.co",
      },
    });
    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
