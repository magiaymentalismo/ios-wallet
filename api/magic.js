const { Redis } = require("@upstash/redis");

function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_KV_REST_API_URL,
    token: process.env.UPSTASH_KV_REST_API_TOKEN,
  });
}

const DEFAULT_STATE = {
  apiUserId: "131", currency: "£", merchantMap: {},
  loyaltyName: "IBERIA", loyaltySubtitle: "PLUS", loyaltyColor: "#D7192D",
  loyaltyFieldLabel: "IBERIA PLUS NUMBER", cardholderName: "ARIEL hamui",
  iberiaNumber: "IB 125900928", iberiaTier: "PLATA",
  iberiaMemberSince: "04/24", iberiaValidThru: "04/26",
  cards: [
    { id: "bbva-1", bank: "BBVA", last4: "1239", color: "from-[#004481] via-[#00a9e0] to-[#004481]", brand: "visa", cardType: "Debit" },
    { id: "revolut-1", bank: "Revolut", last4: "0000", color: "from-[#7b4397] via-[#dc2430] to-[#7b4397]", brand: "mastercard", cardType: "Debit" },
  ],
  apiResult: "", apiLastFetched: "", listening: false, firstCardLast4: "1239",
};

function sessionKey(id) { return id ? `session:${id}` : "session:default"; }

async function getState(sessionId) {
  try {
    const redis = getRedis();
    const state = await redis.get(sessionKey(sessionId));
    return { ...DEFAULT_STATE, ...(state ?? {}) };
  } catch { return { ...DEFAULT_STATE }; }
}

async function saveState(state, sessionId) {
  try {
    const redis = getRedis();
    await redis.set(sessionKey(sessionId), state);
  } catch(e) { console.error("saveState error:", e); }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const sessionId = req.query.s;

  if (req.method === "GET") {
    const state = await getState(sessionId);
    return res.json(state);
  }

  if (req.method === "POST") {
    const updates = req.body ?? {};
    const state = await getState(sessionId);

    if (updates.cardholderName !== undefined) state.cardholderName = updates.cardholderName;
    if (updates.name !== undefined) state.cardholderName = updates.name;
    if (updates.apiUserId !== undefined) state.apiUserId = updates.apiUserId;
    if (updates.iberiaNumber !== undefined) state.iberiaNumber = updates.iberiaNumber;
    if (updates.ibNum !== undefined) state.iberiaNumber = updates.ibNum;
    if (updates.iberiaTier !== undefined) state.iberiaTier = updates.iberiaTier;
    if (updates.ibTier !== undefined) state.iberiaTier = updates.ibTier;
    if (updates.iberiaMemberSince !== undefined) state.iberiaMemberSince = updates.iberiaMemberSince;
    if (updates.ibSince !== undefined) state.iberiaMemberSince = updates.ibSince;
    if (updates.iberiaValidThru !== undefined) state.iberiaValidThru = updates.iberiaValidThru;
    if (updates.ibThru !== undefined) state.iberiaValidThru = updates.ibThru;
    if (updates.currency !== undefined) state.currency = updates.currency;
    if (updates.merchantMap !== undefined) state.merchantMap = { ...(state.merchantMap ?? {}), ...updates.merchantMap };
    if (updates.loyaltyName !== undefined) state.loyaltyName = updates.loyaltyName;
    if (updates.loyaltySubtitle !== undefined) state.loyaltySubtitle = updates.loyaltySubtitle;
    if (updates.loyaltyColor !== undefined) state.loyaltyColor = updates.loyaltyColor;
    if (updates.loyaltyFieldLabel !== undefined) state.loyaltyFieldLabel = updates.loyaltyFieldLabel;
    if (updates.listening !== undefined) state.listening = updates.listening;
    if (updates.apiResult !== undefined) state.apiResult = updates.apiResult;
    if (updates.apiLastFetched !== undefined) state.apiLastFetched = updates.apiLastFetched;

    if (updates.action === "add") {
      state.cards.push({ id: `card-${Date.now()}`, bank: updates.bank ?? "New Bank", last4: "0000", color: updates.color ?? "from-gray-700 to-gray-900", brand: updates.brand ?? "visa", cardType: updates.cardType ?? "Debit" });
    } else if (updates.action === "remove" && updates.cardId) {
      state.cards = state.cards.filter(c => c.id !== updates.cardId);
    } else if (updates.action === "update" && updates.cardId) {
      const card = state.cards.find(c => c.id === updates.cardId);
      if (card) {
        if (updates.bank !== undefined) card.bank = updates.bank;
        if (updates.last4 !== undefined) card.last4 = updates.last4;
        if (updates.color !== undefined) card.color = updates.color;
        if (updates.brand !== undefined) card.brand = updates.brand;
        if (updates.cardType !== undefined) card.cardType = updates.cardType;
      }
    }

    await saveState(state, sessionId);
    return res.json({ status: "updated", magicState: state });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
