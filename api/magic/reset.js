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

module.exports = async function handler(req, res) {
  const sessionId = req.query.s;
  const redis = getRedis();
  const existing = await redis.get(sessionKey(sessionId)) ?? {};
  const freshState = {
    ...DEFAULT_STATE, ...existing,
    apiResult: "", apiLastFetched: "", listening: false,
    cards: (existing.cards ?? DEFAULT_STATE.cards).map((c, i) => ({
      ...c, last4: i === 1 ? "0000" : c.last4,
    })),
  };
  await redis.set(sessionKey(sessionId), freshState);
  return res.json({ status: "reset", freshState });
};
