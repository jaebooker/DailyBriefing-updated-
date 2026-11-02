const $ = (s, el = document) => el.querySelector(s);
const content = $("#content");
const tpl = $("#tpl-story");
const VIEWS = ["briefing", "top", "ai", "cyber", "saved"];
const SECTIONS = ["top", "ai", "cyber"];

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

const state = {
  data: null,
  view: "briefing",
  query: "",
  source: null,                       // selected source id within a section, or null for all
  saved: new Map(store.get("briefing:saved", [])),
};

/* ---------- helpers ---------- */
const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };

function timeAgo(iso) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 0) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function storyEl(item, { lead = false } = {}) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(`cat-${item.category}`);
  if (lead) node.classList.add("lead");
  const link = $(".story-link", node);
  const url = safeUrl(item.url);
  if (url) link.href = url;
  $(".src", node).textContent = item.source;
  const t = $("time", node);
  t.textContent = timeAgo(item.published);
  if (item.published) t.dateTime = item.published;
  $(".headline", node).textContent = item.title;
  $(".summary", node).textContent = item.summary || "";
  const img = safeUrl(item.image);
  if (img) {
    node.classList.add("has-img");
    const el = $("img", node);
    el.src = img;
    el.onerror = () => node.classList.remove("has-img");
  }
  const save = $(".save", node);
  const sync = () => save.setAttribute("aria-pressed", state.saved.has(item.id));
  sync();
  save.addEventListener("click", () => { toggleSave(item); sync(); });
  return node;
}

function toggleSave(item) {
  if (state.saved.has(item.id)) state.saved.delete(item.id);
  else state.saved.set(item.id, { ...item, savedAt: Date.now() });
  store.set("briefing:saved", [...state.saved]);
  updateSavedCount();
  if (state.view === "saved") render();
}
function updateSavedCount() { $("#saved-count").textContent = state.saved.size || ""; }

function matches(item) {
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return (item.title + " " + item.summary + " " + item.source).toLowerCase().includes(q);
}

// Prefer a recent story with an image as the lead.
function pickLead(items) {
  const i = items.slice(0, 6).findIndex((x) => x.image);
  return i > 0 ? [items[i], ...items.filter((_, j) => j !== i)] : items;
}

// Interleave sources so one prolific feed can't dominate a section.
function diversify(items) {
  const bySource = new Map();
  for (const it of items) (bySource.get(it.sourceId) ?? bySource.set(it.sourceId, []).get(it.sourceId)).push(it);
  const out = [];
  const queues = [...bySource.values()];
  while (queues.some((q) => q.length)) {
    const round = queues.filter((q) => q.length).map((q) => q.shift());
    round.sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    out.push(...round);
  }
  return out;
}

/* ---------- views ---------- */
function renderBriefing() {
  const wrap = document.createElement("div");
  wrap.className = "briefing";
  for (const cat of SECTIONS) {
    const items = pickLead(diversify(state.data.items.filter((i) => i.category === cat && matches(i)))).slice(0, 6);
    const col = document.createElement("section");
    col.className = `column cat-${cat}`;
    col.innerHTML = `<div class="section-head"><h2></h2><button type="button">See all →</button></div>`;
    $("h2", col).textContent = state.data.categories[cat].label;
    $("button", col).onclick = () => go(cat);
    items.forEach((it, i) => col.append(storyEl(it, { lead: i === 0 })));
    if (!items.length) col.insertAdjacentHTML("beforeend", `<p class="empty">Nothing here yet.</p>`);
    wrap.append(col);
  }
  return wrap;
}

function renderSection(cat) {
  let items = state.data.items.filter((i) => i.category === cat && matches(i));
  if (state.source) items = items.filter((i) => i.sourceId === state.source);
  else items = diversify(items);
  items = pickLead(items);
  const frag = document.createDocumentFragment();
  if (!items.length) {
    frag.append(Object.assign(document.createElement("p"), { className: "empty", textContent: "No stories match." }));
    return frag;
  }
  const feature = document.createElement("div");
  feature.className = `feature cat-${cat}`;
  feature.append(storyEl(items[0], { lead: true }));
  const side = document.createElement("div");
  side.className = "side";
  items.slice(1, 5).forEach((it) => side.append(storyEl(it)));
  feature.append(side);
  const grid = document.createElement("div");
  grid.className = `grid cat-${cat}`;
  items.slice(5).forEach((it) => grid.append(storyEl(it)));
  frag.append(feature, grid);
  return frag;
}

function renderSaved() {
  const items = [...state.saved.values()].filter(matches).sort((a, b) => b.savedAt - a.savedAt);
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = state.saved.size ? "No saved stories match." : "Tap the bookmark on any story to save it for later.";
    return p;
  }
  const grid = document.createElement("div");
  grid.className = "grid";
  items.forEach((it) => grid.append(storyEl(it)));
  return grid;
}

function renderChips() {
  const chips = $("#chips");
  chips.replaceChildren();
  if (!SECTIONS.includes(state.view)) return;
  chips.className = `chips cat-${state.view}`;
  const sources = state.data.sources.filter((s) => s.category === state.view && s.count);
  const mk = (label, id) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", state.source === id);
    b.onclick = () => { state.source = state.source === id ? null : id; render(); };
    return b;
  };
  chips.append(mk("All", null), ...sources.map((s) => mk(s.name, s.id)));
}

function render() {
  document.querySelectorAll(".tabs button").forEach((b) => {
    const on = b.dataset.view === state.view;
    b.setAttribute("aria-selected", on);
    if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  $("#toolbar").hidden = !state.data;
  if (!state.data) return;
  renderChips();
  const view =
    state.view === "briefing" ? renderBriefing() :
    state.view === "saved" ? renderSaved() :
    renderSection(state.view);
  content.replaceChildren(view);
}

function renderFooter() {
  const { sources, generatedAt } = state.data;
  const up = sources.filter((s) => s.ok).length;
  $("#status").textContent = `Updated ${new Date(generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${state.data.items.length} stories from ${up} of ${sources.length} sources`;
  const list = $("#source-list");
  list.replaceChildren(...sources.map((s) => {
    const li = document.createElement("li");
    li.textContent = `${s.name} (${state.data.categories[s.category].label})`;
    if (!s.ok) { li.className = "down"; li.title = s.error || "unavailable"; }
    return li;
  }));
}

/* ---------- data + routing ---------- */
async function load({ bust = false } = {}) {
  const btn = $("#refresh");
  btn.classList.add("spin");
  try {
    const res = await fetch("/api/briefing" + (bust ? `?t=${Date.now()}` : ""));
    if (!res.ok) throw new Error(res.statusText);
    state.data = await res.json();
    renderFooter();
    render();
  } catch (err) {
    if (!state.data) {
      content.innerHTML = `<div class="error"><p>Couldn't load today's briefing.</p><button type="button">Try again</button></div>`;
      $(".error button").onclick = () => load({ bust: true });
    }
  } finally {
    btn.classList.remove("spin");
  }
}

function go(view) { location.hash = view === "briefing" ? "" : view; }
function fromHash() {
  const v = location.hash.slice(1);
  state.view = VIEWS.includes(v) ? v : "briefing";
  state.source = null;
  render();
  window.scrollTo({ top: 0 });
}

function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

/* ---------- init ---------- */
$("#today").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => go(b.dataset.view)));
$("#refresh").onclick = () => load({ bust: true });
$("#theme").onclick = () => {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  applyTheme(next);
  store.set("briefing:theme", next);
};
let t;
$("#search").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.query = e.target.value.trim(); render(); }, 120); });
addEventListener("hashchange", fromHash);

applyTheme(store.get("briefing:theme", null));
updateSavedCount();
fromHash();
load();
setInterval(() => document.visibilityState === "visible" && load(), 15 * 60 * 1000);
