// Sends a value to GOO! (11q.co)'s "thump" endpoint, which stores it as
// that Goo ID's last search query — the write-side counterpart to
// api/source-proxy.js. Used to relay data captured on the performer's own
// device (e.g. the 4 digits tapped on the hidden loyalty-card grid) out to
// GOO, so it comes back later through /pro-api/{goo_id}/last-bd like a
// normal search would have.
//
// Same Cloudflare situation as api/source-proxy.js: 11q.co doesn't send
// CORS headers (browser calls fail) and Vercel's Node serverless IPs get a
// Cloudflare challenge/403, so this runs on the Edge runtime.
export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "missing userId" }, { status: 400 });
  }

  let query;
  try {
    const body = await req.json();
    query = body?.query;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!query) {
    return Response.json({ error: "missing query" }, { status: 400 });
  }

  try {
    const r = await fetch(`https://11q.co/api/thump/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Referer: "https://11q.co/",
        Origin: "https://11q.co",
      },
      body: JSON.stringify({ query: String(query) }),
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
