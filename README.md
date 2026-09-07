# Webanly

A self-hosted, privacy-friendly web analytics platform with real-time dashboards — built as a TypeScript monorepo.

**Live demo:** https://webanly-dashboard.vercel.app/
**Video demo:** https://youtu.be/3s94YRIDrpw

---

## What it does

Webanly lets you track visitors on your own website without relying on third-party analytics tools. Add a domain, drop in one script tag, and get:

- A **live dashboard** showing visitors, page views, and events as they happen
- **Historical analytics** — traffic over time, top pages, browsers, devices, countries, referrers, exit pages
- **Automatic spike alerts** when traffic jumps above your site's normal range
- **Domain-scoped API keys** so each tracked site is isolated
- **Timezone-aware reporting** — "today" means today in the visitor's timezone, not the server's

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TanStack Query, Redux Toolkit, shadcn/ui, Tailwind CSS |
| Backend | Express, Node.js |
| Database | PostgreSQL + Prisma |
| Event pipeline | Kafka (KRaft mode) |
| Cache / rate tracking | Redis |
| Realtime updates | WebSockets |
| Auth | better-auth (GitHub OAuth) |
| Geo lookups | MaxMind GeoLite2 |
| Monorepo tooling | Turborepo, npm workspaces |
| Containerization | Docker, Docker Compose |

---

## How it works

1. A lightweight tracking script (`script.js`) runs on the customer's website and sends pageview events to the collector API.
2. The collector validates the API key, enriches the event (country from IP, referrer, device info), and publishes it to Kafka.
3. Two things consume from Kafka in parallel:
   - A **worker** that writes events into Postgres for historical queries.
   - A **WebSocket broadcaster** that pushes the event to any dashboard currently connected for that domain, for the live view.
4. A **spike detector** runs on a schedule, comparing recent traffic against an adaptive expected baseline (the baseline self-adjusts up when traffic grows and down when it's quiet), and fires a notification when there's a real spike.
5. The dashboard (Next.js) reads historical data via REST endpoints (cached in Redis) and live data via a WebSocket connection, merging both into the same charts.

---

## Project Structure

```
webanly/
├── apps/
│   ├── web/            # Next.js frontend (dashboards, auth, domain management)
│   └── server/          # Express backend — collector API, Kafka workers, WebSocket server
├── packages/
│   ├── db/               # Prisma schema, migrations, generated client
│   ├── redis/            # Shared Redis client + cache helpers
│   ├── ui/                # Shared shadcn/ui component library
│   ├── types/             # Shared TypeScript types
│   ├── eslint-config/      # Shared lint rules
│   └── typescript-config/   # Shared tsconfig presets
├── docker-compose.yml
└── turbo.json
```

---

## Running Locally with Docker (recommended)

This is the easiest way to run the full stack — Postgres, Redis, Kafka, backend, and frontend — with one command.

### Prerequisites

- Docker + Docker Compose
- A free [MaxMind](https://www.maxmind.com/en/geolite2/signup) account and license key (used for IP → country lookups)
- A GitHub OAuth app (for login) — create one at GitHub → Settings → Developer settings → OAuth Apps

### Setup

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd webanly
   ```

2. Create a `.env` file in the repo root:
   ```bash
   MAXMIND_LICENSE_KEY=your_maxmind_license_key
   BETTER_AUTH_SECRET=generate_a_random_32_char_secret
   BETTER_AUTH_BASE_URL=http://localhost:3000
   BETTER_AUTH_URL=http://localhost:3000
   GITHUB_CLIENT_ID=your_github_oauth_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
   NEXT_PUBLIC_WSS_URL=ws://localhost:4000
   NEXT_PUBLIC_COLLECTOR_SCRIPT_URL=http://localhost:4000/script.js
   ```

3. Build and start everything:
   ```bash
   docker compose up --build
   ```

   This spins up Postgres, Redis, and Kafka, runs database migrations automatically, then starts the backend and frontend in the right order.

4. Open the app:
   - Frontend: `http://localhost:3000`
   - Backend/collector: `http://localhost:4000`

5. Stop everything:
   ```bash
   docker compose down
   ```
   Add `-v` to also wipe the database and Redis data.

> **Note:** The GeoLite2 database file is *not* baked into the Docker image (keeps it lightweight) — it's downloaded automatically the first time the server container starts, using your `MAXMIND_LICENSE_KEY`.

---

## Running Without Docker (manual setup)

### Prerequisites

- Node.js LTS
- npm
- PostgreSQL
- Redis
- Kafka

### Steps

```bash
npm install

# Add .env files with your DATABASE_URL, REDIS_URL, Kafka broker address,
# and auth credentials in both apps/web and apps/server

npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma

npm run dev
```

This starts all apps via Turborepo.

---

## Deployment

The hosted demo runs on:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon (managed PostgreSQL)
- **Redis:** Upstash
- **Kafka:** Aiven

The included Dockerfiles and `docker-compose.yml` can also be used to self-host on any VPS or container platform.

---

## Known Limitations

- Domain ownership is varification method is not reay — DNS TXT record verification is a planned enhancement (schema fields for it already exist). so there will be hardcored random prefix and suffix string in domainname.
- No automated test suite yet.
- Origin checking on the collector logs a warning on mismatch but currently doesn't block the request, pending full domain verification.

---

## License

This project is for portfolio/demonstration purposes.

![alt text](<Screenshot 2026-08-22 140408.png>)
![alt text](<Screenshot 2026-08-21 182703.png>)
![alt text](<Screenshot 2026-08-21 182703.png>)
![alt text](<Screenshot 2026-08-21 195432.png>)
![alt text](<Screenshot 2026-08-21 195333.png>)
