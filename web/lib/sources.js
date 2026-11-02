// Every source is a public RSS/Atom feed. No API keys required.
// To add a source, append an entry. `category` must be one of: top, ai, cyber.
export const CATEGORIES = {
  top: { label: "Top News" },
  ai: { label: "AI" },
  cyber: { label: "Cybersecurity" },
};

export const SOURCES = [
  // Top news
  { id: "bbc", name: "BBC News", category: "top", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { id: "aljazeera", name: "Al Jazeera", category: "top", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { id: "guardian", name: "The Guardian", category: "top", url: "https://www.theguardian.com/world/rss" },
  { id: "nyt", name: "New York Times", category: "top", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { id: "npr", name: "NPR", category: "top", url: "https://feeds.npr.org/1001/rss.xml" },
  { id: "independent", name: "The Independent", category: "top", url: "https://www.independent.co.uk/news/world/rss" },
  { id: "hindu", name: "The Hindu", category: "top", url: "https://www.thehindu.com/news/international/feeder/default.rss" },

  // AI
  { id: "mittr", name: "MIT Technology Review", category: "ai", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { id: "verge-ai", name: "The Verge", category: "ai", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { id: "ars-ai", name: "Ars Technica", category: "ai", url: "https://arstechnica.com/ai/feed/" },
  { id: "tc-ai", name: "TechCrunch", category: "ai", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { id: "importai", name: "Import AI", category: "ai", url: "https://importai.substack.com/feed" },
  { id: "openai", name: "OpenAI", category: "ai", url: "https://openai.com/news/rss.xml" },
  { id: "deepmind", name: "Google DeepMind", category: "ai", url: "https://deepmind.google/blog/rss.xml" },
  { id: "hf", name: "Hugging Face", category: "ai", url: "https://huggingface.co/blog/feed.xml" },
  { id: "af", name: "Alignment Forum", category: "ai", url: "https://www.alignmentforum.org/feed.xml" },

  // Cybersecurity
  { id: "krebs", name: "Krebs on Security", category: "cyber", url: "https://krebsonsecurity.com/feed/" },
  { id: "thn", name: "The Hacker News", category: "cyber", url: "https://feeds.feedburner.com/TheHackersNews" },
  { id: "bleeping", name: "BleepingComputer", category: "cyber", url: "https://www.bleepingcomputer.com/feed/" },
  { id: "darkreading", name: "Dark Reading", category: "cyber", url: "https://www.darkreading.com/rss.xml" },
  { id: "securityweek", name: "SecurityWeek", category: "cyber", url: "https://www.securityweek.com/feed/" },
  { id: "schneier", name: "Schneier on Security", category: "cyber", url: "https://www.schneier.com/feed/atom/" },
  { id: "record", name: "The Record", category: "cyber", url: "https://therecord.media/feed" },
  { id: "wired-sec", name: "Wired Security", category: "cyber", url: "https://www.wired.com/feed/category/security/latest/rss" },
];
