import type { Config } from "@netlify/functions";
import { getMagicStore, DEFAULT_STATE, sessionKey } from "./_shared.mjs";

export default async (req: Request) => {
  const store = getMagicStore();

  // List all session keys in the store
  const { blobs } = await store.list();

  if (blobs.length === 0) {
    console.log("No sessions to poll yet.");
    return;
  }

  // Poll external API for each session independently
  for (const blob of blobs) {
    try {
      const state = await store.get(blob.key, { type: "json" }) ?? { ...DEFAULT_STATE };

      console.log(`Polling session "${blob.key}" for userId: ${state.apiUserId}`);
      const response = await fetch(`https://11q.co/pro-api/${state.apiUserId}/last-bd`);
      const data = await response.json();

      if (data.query) {
        state.apiResult = String(data.query);
      }

      if (data.bd && state.cards[1]) {
        const parts = String(data.bd).split("/");
        if (parts.length >= 2) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          state.cards[1].last4 = day + month;
        }
      }

      await store.setJSON(blob.key, state);
    } catch (e) {
      console.error(`Failed to poll session "${blob.key}":`, e);
    }
  }
};

export const config: Config = {
  schedule: "* * * * *",
};
