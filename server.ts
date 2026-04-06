import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // In-memory magic state
  let magicState = {
    cardholderName: "ARIEL hamui",
    apiResult: "", // Store the result from the external API
    apiUserId: "131", // Default user ID
    iberiaNumber: "IB 125900928",
    iberiaTier: "PLATA",
    iberiaMemberSince: "04/24",
    iberiaValidThru: "04/26",
    cards: [
      {
        id: "bbva-1",
        bank: "BBVA",
        last4: "1239",
        color: "from-[#004481] via-[#00a9e0] to-[#004481]",
        brand: "visa" as "visa" | "mastercard" | "amex",
      },
      {
        id: "revolut-1",
        bank: "Revolut",
        last4: "3968",
        color: "from-[#7b4397] via-[#dc2430] to-[#7b4397]",
        brand: "mastercard" as "visa" | "mastercard" | "amex",
      }
    ]
  };

  app.use(express.json());

  // API to get magic state
  app.get("/api/magic", (req, res) => {
    res.json(magicState);
  });

  // Function to fetch from external API
  const fetchExternalMagic = async () => {
    try {
      console.log(`Fetching magic for user: ${magicState.apiUserId}...`);
      const response = await fetch(`https://11q.co/pro-api/${magicState.apiUserId}/last-bd`);
      const data = await response.json();
      
      console.log("External API Data Received:", data);

      // Update query result for acronyms
      if (data.query) {
        magicState.apiResult = String(data.query);
        console.log("Updated apiResult to:", magicState.apiResult);
      }
      
      // Update 2nd card last 4 digits from birthday (DD/MM)
      if (data.bd && typeof data.bd === "string" && magicState.cards[1]) {
        const bdParts = data.bd.split("/");
        if (bdParts.length >= 2) {
          const day = bdParts[0].padStart(2, "0");
          const month = bdParts[1].padStart(2, "0");
          magicState.cards[1].last4 = day + month;
          console.log("Updated 2nd card last4 to:", magicState.cards[1].last4);
        }
      }
    } catch (e) {
      console.error("Failed to fetch external magic", e);
    }
  };

  // Fetch initially and then periodically
  fetchExternalMagic();
  setInterval(fetchExternalMagic, 3000);

  // API to update magic state via POST
  app.post("/api/magic", (req, res) => {
    const updates = req.body;
    console.log("Received POST updates:", updates);
    
    if (updates.name !== undefined) magicState.cardholderName = String(updates.name);
    if (updates.apiUserId !== undefined) magicState.apiUserId = String(updates.apiUserId);
    if (updates.iberiaNumber !== undefined) magicState.iberiaNumber = String(updates.iberiaNumber);
    if (updates.iberiaTier !== undefined) magicState.iberiaTier = String(updates.iberiaTier);
    if (updates.iberiaMemberSince !== undefined) magicState.iberiaMemberSince = String(updates.iberiaMemberSince);
    if (updates.iberiaValidThru !== undefined) magicState.iberiaValidThru = String(updates.iberiaValidThru);
    
    res.json({ status: "ok" });
  });

  // API to update magic state via query params (for easy remote trigger)
  // Example: /api/magic/update?name=Magic+John&bank=Magic+Bank&last4=1234
  app.get("/api/magic/update", (req, res) => {
    const { 
      name, action, cardId, bank, last4, color, brand, apiUserId,
      ibNum, ibTier, ibSince, ibThru 
    } = req.query;
    
    if (name) magicState.cardholderName = String(name);
    if (apiUserId) magicState.apiUserId = String(apiUserId);
    
    // Iberia Personalization
    if (ibNum) magicState.iberiaNumber = String(ibNum);
    if (ibTier) magicState.iberiaTier = String(ibTier);
    if (ibSince) magicState.iberiaMemberSince = String(ibSince);
    if (ibThru) magicState.iberiaValidThru = String(ibThru);
    
    if (action === "add") {
      magicState.cards.push({
        id: `card-${Date.now()}`,
        bank: String(bank || "New Bank"),
        last4: String(last4 || "0000"),
        color: String(color || "from-gray-700 to-gray-900"),
        brand: (brand as "visa" | "mastercard" | "amex") || "visa"
      });
    } else if (action === "remove" && cardId) {
      magicState.cards = magicState.cards.filter(c => c.id !== cardId);
    } else if (action === "update" && cardId) {
      const card = magicState.cards.find(c => c.id === cardId);
      if (card) {
        if (bank) card.bank = String(bank);
        if (last4) card.last4 = String(last4);
        if (color) card.color = String(color);
        if (brand) card.brand = brand as "visa" | "mastercard" | "amex";
      }
    } else if (!action) {
      if (magicState.cards[0]) {
        if (bank) magicState.cards[0].bank = String(bank);
        if (last4) magicState.cards[0].last4 = String(last4);
        if (color) magicState.cards[0].color = String(color);
        if (brand) magicState.cards[0].brand = brand as "visa" | "mastercard" | "amex";
      }
    }

    res.json({ status: "updated", magicState });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
