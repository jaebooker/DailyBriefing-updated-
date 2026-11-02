import { getBriefing } from "../lib/feeds.js";

// Vercel serverless function: GET /api/briefing
export default async function handler(req, res) {
  try {
    const data = await getBriefing();
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(JSON.stringify(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
