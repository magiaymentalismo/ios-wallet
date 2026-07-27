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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.all("/api/magic", magicHandler);
  app.all("/api/magic/reset", magicResetHandler);
  app.all("/api/webhook", webhookHandler);
  app.all("/api/proxy", proxyHandler);
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
