# Webanly

A privacy-friendly web analytics platform with real-time dashboards, built as a TypeScript monorepo.

**Live demo:** <https://webanly-dashboard.vercel.app/>
**Video demo:** <https://youtu.be/3s94YRIDrpw>

---

## What it does

Webanly lets you track visitors on your own website without relying on third-party analytics tools. Add a domain, drop in one script tag, and get:

- A **live dashboard** showing visitors, page views, and events as they happen
- **Historical analytics**: traffic over time, top pages, browsers, devices, countries, referrers, and exit pages
- An **AI traffic analyst chatbot** that explains your traffic data and answers any question about your website's traffic in simple words
- **Automatic spike alerts** when traffic jumps above your site's normal range
- **Domain-scoped API keys**, so each tracked site is isolated
- **Timezone-aware reporting**: "today" means today in the visitor's timezone, not the server's

---

## Tech Stack

| Layer                 | Technology                                                             |
| --------------------- | ---------------------------------------------------------------------- |
| Frontend              | Next.js, React, TanStack Query, Redux Toolkit, shadcn/ui, Tailwind CSS |
| Backend               | Express, Node.js                                                       |
| Database              | PostgreSQL + Prisma                                                    |
| Event pipeline        | Kafka                                                                  |
| Cache / rate tracking | Redis                                                                  |
| Realtime updates      | WebSockets                                                             |
| Auth                  | better-auth (GitHub OAuth)                                             |
| Geo lookups           | MaxMind GeoLite2                                                       |
| Monorepo tooling      | Turborepo, npm workspaces                                              |
| Containerization      | Docker, Docker Compose                                                 |

---


## How it works

1. A lightweight tracking script (`script.js`) runs on the customer's website and sends pageview events to the collector API.
2. The collector validates the API key, enriches the event (country from IP, referrer, device info), and publishes it to Kafka.
3. Two things consume from Kafka in parallel:
   - A **worker** that writes events into Postgres for historical queries.
   - A **WebSocket broadcaster** that pushes the event to any dashboard currently connected for that domain, for the live view.
4. A **spike detector** runs on a schedule and compares recent traffic against an adaptive expected baseline. The baseline adjusts up when traffic grows and down when it is quiet. It fires a notification when there is a real spike.
5. The dashboard (Next.js) reads historical data via REST endpoints (cached in Redis) and live data via a WebSocket connection, then merges both into the same charts.

---

## Project Structure

### Codebase and engineering notes

```
webanly/
├── apps/
│   ├── web/                  # Next.js frontend (dashboards, auth, domain management)
│   └── server/               # Express backend: collector API, Kafka workers, WebSocket server
├── packages/
│   ├── db/                   # Prisma schema, migrations, generated client
│   ├── redis/                # Shared Redis client + cache helpers
│   ├── ui/                   # Shared shadcn/ui component library
│   ├── types/                # Shared TypeScript contracts and Zod validation schemas
│   ├── eslint-config/        # Shared lint rules
│   └── typescript-config/    # Shared tsconfig presets
├── docker-compose.yml
└── turbo.json
```

### Code organization

- `packages/types` owns shared TypeScript contracts and runtime Zod schemas. Keep schemas used by multiple apps here and export them from a focused package entry point.
- Keep Express middleware and HTTP-specific behavior in `apps/server`. Routes validate requests, async failures go to the central error handler, and service functions handle application logic.
- Keep Next.js route handlers, server actions, and UI-specific behavior in the web app. Do not put framework middleware in the shared types package.

---

## Running Locally with Docker (recommended)

This is the easiest way to run the full stack (Postgres, Redis, Kafka, backend, and frontend) with one command.

### Prerequisites

- Docker + Docker Compose
- A free [MaxMind](https://www.maxmind.com/en/geolite2/signup) account and license key (used for IP-to-country lookups)
- A GitHub OAuth app for login. Create one at GitHub → Settings → Developer settings → OAuth Apps

### Setup

1. Clone the repo:

   ```
   git clone <repo-url>
   cd webanly
   ```

2. Create a `.env` file in the repo root:

   ```
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

   ```
   docker compose up --build
   ```

   This starts Postgres, Redis, and Kafka, runs database migrations automatically, then starts the backend and frontend in the right order.

4. Open the app:

   - Frontend: `http://localhost:3000`
   - Backend/collector: `http://localhost:4000`

5. Stop everything:

   ```
   docker compose down
   ```

   Add `-v` to also wipe the database and Redis data.

> **Note:** The GeoLite2 database file is *not* included in the Docker image, to keep it lightweight. It is downloaded automatically the first time the server container starts, using your `MAXMIND_LICENSE_KEY`.

---

## Running Without Docker (manual setup)

### Prerequisites

- Node.js LTS
- npm
- PostgreSQL
- Redis
- Kafka

### Steps

```
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

- Domain ownership verification is not ready yet. DNS TXT record verification is planned, and the schema fields for it already exist. Until then, a hardcoded random prefix and suffix is added to each domain name.
- There is no automated test suite yet.
- Origin checking on the collector logs a warning on mismatch but does not block the request yet, pending full domain verification.

---

## Screenshots



![Webanly screenshot 1](Screenshot%202026-08-22%20140408.png)




![Webanly screenshot 2](Screenshot%202026-08-21%20182703.png)




![Webanly screenshot 3](Screenshot%202026-08-21%20195432.png)




![Webanly screenshot 4](Screenshot%202026-08-21%20195333.png)




![Webanly screenshot 5](Screenshot%202026-09-17%20005924.png)




![Webanly screenshot 6](Screenshot%202026-09-17%20010002.png)




![Webanly screenshot 7](Screenshot%202026-09-17%20010032.png)



---

## License

This project is for portfolio and demonstration purposes.
