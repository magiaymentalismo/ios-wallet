import { getState, resetForNewSpectator, saveState } from "../_lib/state.js";

export default async function handler(req, res) {
  const sessionId = req.query.s;
  const existing = await getState(sessionId);
  const freshState = resetForNewSpectator(existing);
  await saveState(freshState, sessionId);
  return res.json({ status: "reset", freshState });
}
