import { XMLParser } from "fast-xml-parser";
import { SOURCES, CATEGORIES } from "./sources.js";

const PER_SOURCE = 12;        // newest N items kept from each feed
const TIMEOUT_MS = 9000;
const CACHE_MS = 10 * 60 * 1000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
  processEntities: false, // decoded manually; some feeds exceed the parser's entity limit
  htmlEntities: false,
});

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const text = (x) => {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number") return unCdata(String(x));
  if (Array.isArray(x)) return text(x[0]);
  return text(x["#text"] ?? x["@href"] ?? "");
};

const unCdata = (s) => s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–" };
function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z#0-9]+);/gi, (m, e) => ENTITIES[e] ?? m);
}
function stripHtml(html) {
  // decode first so entity-escaped markup (&lt;p&gt;) is also stripped
  return decode(
    decode(String(html || ""))
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}
function summarize(s, max = 260) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

function findImage(item, html) {
  const candidates = [
    ...arr(item["media:content"]),
    ...arr(item["media:group"]?.["media:content"]),
    ...arr(item["media:thumbnail"]),
    ...arr(item.enclosure),
  ];
  for (const c of candidates) {
    const url = c?.["@url"];
    const type = c?.["@type"] || c?.["@medium"] || "";
    if (url && (!type || /image/.test(type))) return decode(url);
  }
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || "");
  return m ? decode(m[1]) : null;
}

// Some feeds ship tiny thumbnails; ask their CDNs for a larger rendition.
function upsize(url) {
  if (!url) return url;
  // (Guardian URLs are signed, so they can't be resized this way.)
  return url.replace(/(ichef\.bbci\.co\.uk\/ace\/standard\/)\d+\//, "$1800/");
}

function linkOf(item) {
  if (typeof item.link === "string") return decode(item.link.trim());
  const links = arr(item.link);
  const alt = links.find((l) => !l["@rel"] || l["@rel"] === "alternate") || links[0];
  return decode((alt?.["@href"] || text(alt) || text(item.guid) || "").trim());
}

function normalize(item, source) {
  const html = decode(text(item["content:encoded"]) || text(item.content) || text(item.description) || text(item.summary));
  const date = new Date(text(item.pubDate) || text(item.published) || text(item.updated) || text(item["dc:date"]));
  const title = stripHtml(text(item.title));
  const url = linkOf(item);
  if (!title || !url) return null;
  return {
    id: url,
    title,
    url,
    summary: summarize(stripHtml(html)),
    author: stripHtml(text(item["dc:creator"]) || text(item.author?.name) || text(item.author)) || null,
    image: upsize(findImage(item, html)),
    published: isNaN(date) ? null : date.toISOString(),
    source: source.name,
    sourceId: source.id,
    category: source.category,
  };
}

async function fetchSource(source) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(source.url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (DailyBriefing; +https://github.com/jaebooker/DailyBriefing-updated-)", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = parser.parse(await res.text());
    const raw = doc.rss?.channel?.item ?? doc.feed?.entry ?? doc["rdf:RDF"]?.item ?? [];
    const items = arr(raw)
      .map((i) => normalize(i, source))
      .filter(Boolean)
      .sort((a, b) => (b.published || "").localeCompare(a.published || ""))
      .slice(0, PER_SOURCE);
    return { ok: true, items };
  } catch (err) {
    return { ok: false, error: err.name === "AbortError" ? "timeout" : err.message, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

let cache = { at: 0, data: null, pending: null };

export async function getBriefing({ force = false } = {}) {
  if (!force && cache.data && Date.now() - cache.at < CACHE_MS) return cache.data;
  if (cache.pending) return cache.pending;
  cache.pending = (async () => {
    const results = await Promise.all(SOURCES.map(fetchSource));
    const seen = new Set();
    const items = [];
    const sources = SOURCES.map((s, i) => {
      for (const it of results[i].items) {
        const key = it.title.toLowerCase();
        if (seen.has(it.url) || seen.has(key)) continue;
        seen.add(it.url); seen.add(key);
        items.push(it);
      }
      return { id: s.id, name: s.name, category: s.category, ok: results[i].ok, count: results[i].items.length, error: results[i].error };
    });
    items.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    const data = { generatedAt: new Date().toISOString(), categories: CATEGORIES, sources, items };
    cache = { at: Date.now(), data, pending: null };
    return data;
  })();
  try { return await cache.pending; } finally { cache.pending = null; }
}
