// Local dev server only. Production runs on Vercel, which serves everything
// under api/ as serverless functions directly — this file is never deployed
// (see vercel.json / package.json build script). It exists purely so
// `npm run dev` gets a working /api/* locally, by mounting the exact same
// handler modules Vercel uses.
import express from "express";
import { createServer as createViteServer } from "vite";

import magicHandler from "./api/magic.js";
import magicResetHandler from "./api/magic/reset.js";
import webhookHandler from "./api/webhook.js";
import proxyHandler from "./api/proxy.js";
import debugHandler from "./api/debug.js";

// api/proxy.js runs on Vercel's Edge runtime (Web API Request/Response),
// unlike the other handlers here which use the classic Node (req, res)
// signature. Adapt Express's request into a Request so it still works
// against the exact same handler locally.
function mountEdgeHandler(app: express.Express, route: string, handler: (req: Request) => Promise<Response>) {
  app.all(route, async (req, res) => {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const webRequest = new Request(url, { method: req.method, headers: req.headers as HeadersInit });
    const webResponse = await handler(webRequest);
    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await webResponse.text());
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.all("/api/magic", magicHandler);
  app.all("/api/magic/reset", magicResetHandler);
  app.all("/api/webhook", webhookHandler);
  mountEdgeHandler(app, "/api/proxy", proxyHandler);
  app.all("/api/debug", debugHandler);

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
