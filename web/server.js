// Local dev server: `npm install && npm run dev`, then open http://localhost:3000
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { getBriefing } from "./lib/feeds.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const port = process.env.PORT || 3000;

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  if (pathname === "/api/briefing") {
    try {
      const data = await getBriefing();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(500); return res.end(e.message);
    }
  }
  const file = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": (types[extname(file)] || "application/octet-stream") + "; charset=utf-8" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
}).listen(port, () => console.log(`Daily Briefing running at http://localhost:${port}`));
