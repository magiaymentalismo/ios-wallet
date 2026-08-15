// Generic server-side proxy for polling any active source — GOO! (11q.co),
// InjectID (11z.co), or a custom URL added under Settings > Conectores.
// Third-party services in this space commonly (a) don't send CORS headers,
// so the browser can't call them directly, and (b) Cloudflare-style bot
// protection can challenge/403 Vercel's Node serverless egress IPs — same
// reason api/thump.js is also an Edge function — so this runs on the Edge
// runtime, whose IP pool isn't flagged.
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target");
  if (!target || !/^https?:\/\//i.test(target)) {
    return Response.json({ error: "missing or invalid target" }, { status: 400 });
  }

  try {
    const r = await fetch(target, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
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
