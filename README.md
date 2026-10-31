# Shkolo Web

A self-hosted interface for the Bulgarian school platform **Shkolo** — the same pages and
data Shkolo shows you, rebuilt with our own dark styling and powered by
[`shkolo-api`](https://github.com/Chernuga/shkolo-api) (a Cloudflare Worker).

It is **not** an official Shkolo product. It reads *your own* account for personal use.

## What it looks like

```
┌──────────────────────────────────────────────┬─────────────────────┐
│  Shkolo            Дневник        ученик ·· ·│  ← top bar          │
├───────────┬──────────────────────────────────┴─────────────────────┤
│ ▲ Оценки  │  Оценки                                   [ Обнови ]    │
│ ▤ Програма│  ┌───────────────────────────────────────────────┐    │
│ ◱ Отсъствия│ │ №  Предмет            I срок   II срок  Среден│   │
│ ✎ Домашни │ │ 1  БЕЛ                (6) (6)     —       6.0 │   │
│ ⌘ Raw     │ │ 2  Английски език     (5)         —       5.0 │   │
│           │ └───────────────────────────────────────────────┘    │
└───────────┴──────────────────────────────────────────────────────┘
```

Views:

| View | Source |
|---|---|
| **Оценки** (grades) | `/grades` — the Worker's parsed JSON, with subject / min / max filters |
| **Програма** (schedule) | `/schedule` — weekly timetable, week navigation |
| **Отсъствия** / **Домашни** | `/raw/absences`, `/raw/homeworks` — Shkolo's own pages in a frame |
| **Raw** | `/raw/<any path>` — explore any Shkolo page |

## Architecture

```
browser ──► shkolo-web (Cloudflare Pages)
              │  /api/login       → proxied, session cookie set first-party
              │  everything else  → proxied to shkolo-api
              ▼
            shkolo-api (Cloudflare Worker)
              │  POST /api/login → Browser Run (real Chrome) → app.shkolo.bg
              │  data calls      → plain fetch with the stored cookies
              ▼
            app.shkolo.bg
```

The UI is pure HTML/CSS/JS — no build step, no framework, no dependencies.

## Deploy

```bash
npm install
npx wrangler login

# create the Pages project once
npx wrangler pages project create shkolo-web

# point it at your Worker (set as a Pages environment variable)
npx wrangler pages secret put SHKOLO_API_BASE --project-name shkolo-web
# value: https://shkolo-api.<your-subdomain>.workers.dev

# deploy
npx wrangler pages deploy .
```

Then open `https://shkolo-web.pages.dev`. Want to check the wiring first?
Visit `/config-check.html` — it shows the configured API base and whether it responds.

### Local development

```bash
npm run dev
# set SHKOLO_API_BASE in .dev.vars
```

`.dev.vars`:

```
SHKOLO_API_BASE=https://shkolo-api.<your-subdomain>.workers.dev
```

## Security notes

- The password is sent once, straight to the Worker. Neither this site nor
  `localStorage` ever stores it.
- The session lives in an `HttpOnly` cookie; JavaScript cannot read it.
- `SHKOLO_API_BASE` is the only configuration, and it is not a secret.
- Pages Functions proxy only `/api/*` and Shkolo data paths — no arbitrary URLs.

## Caveats

- Cloudflare Bot Fight Mode (dashboards, or auto-enabled from dashboard sign-up)
  intercepts `/api/*` and can block browser requests to it. If login fails with an HTML
  page instead of JSON, disable Browser Integrity Check / Bot Fight Mode for the project.
- Shkolo sessions last ~3 hours; the UI shows the login screen again afterwards.
- Unofficial: Shkolo can change their markup or endpoints at any time.

## License

MIT — personal use only.
