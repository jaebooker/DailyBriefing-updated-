# Your Daily Briefing (v2, web)

A rebuild of the 2017 iOS app as a web app. Same idea: one place for the day's headlines. New in this version:

- **Three sections:** Top News, **AI**, and **Cybersecurity**, plus a Briefing front page that shows the latest from all three side by side.
- **24 sources, no API key.** The original used NewsAPI v1, which has been shut down. v2 reads public RSS/Atom feeds, so there is nothing to sign up for or leak.
- Source filter chips, headline search, save-for-later (stored in your browser), light/dark theme, and auto-refresh every 15 minutes.
- Mixes sources so one prolific feed (OpenAI, Hugging Face) can't crowd out a section.

## Sources

| Section | Sources |
| --- | --- |
| Top News | BBC News, Al Jazeera, The Guardian, New York Times, NPR, The Independent, The Hindu |
| AI | MIT Technology Review, The Verge, Ars Technica, TechCrunch, Import AI, OpenAI, Google DeepMind, Hugging Face, Alignment Forum |
| Cybersecurity | Krebs on Security, The Hacker News, BleepingComputer, Dark Reading, SecurityWeek, Schneier on Security, The Record, Wired Security |

Add or remove a source by editing `lib/sources.js`. If a feed goes down, the rest still load and the footer marks it as unavailable.

## Run locally

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel

Import the repo in Vercel and set **Root Directory** to `web`. No build command or environment variables are needed. `public/` is served as static files and `api/briefing.js` runs as a serverless function, cached at the edge for 10 minutes.

## Layout

```
web/
  api/briefing.js    Vercel function: GET /api/briefing
  lib/sources.js     Feed list (edit this to change sources)
  lib/feeds.js       Fetch, parse, normalize, dedupe, cache
  public/            Front end (vanilla HTML/CSS/JS, no build step)
  server.js          Local dev server
```

The original Swift app is untouched in `YourDailyBriefing/`.
