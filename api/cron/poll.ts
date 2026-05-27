import type { VercelRequest, VercelResponse } from "@vercel/node";

// Cron job no longer needed — polling is done from the frontend browser
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.json({ status: "ok", message: "polling handled by frontend" });
}
