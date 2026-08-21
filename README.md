# Webanly

A privacy-friendly, self-hostable web analytics platform (inspired by Plausible) with real-time dashboards, built as a Turborepo monorepo.

## Features

- **Real-time analytics dashboard** — live visitor counts, pageviews, and event streams via WebSockets
- **Event pipeline** powered by Kafka, with a dual-topic design:
  - `raw-events` — full payload, longer retention, consumed by DB dumpers
  - `realtime-events` — slim payload, short retention, consumed for live WebSocket broadcast
- **Visitor tracking** using Redis with timezone-aware, date-partitioned keys
- **Spike detection** with a self-decaying adaptive threshold
- **Domain & session management** with API key validation (Redis-cached) and ownership checks
- **Notifications system** with optimistic UI updates
- **Auth** via `better-auth` with GitHub OAuth

## Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | Next.js, TanStack Query, Redux, shadcn/ui |
| Backend    | Express, Node.js |
| Database   | PostgreSQL + Prisma |
| Messaging  | Kafka |
| Cache      | Redis |
| Realtime   | WebSockets |
| Monorepo   | Turborepo |

## Project Structure

```
webanly/
├── apps/
│   ├── web/          # Next.js frontend
│   └── server/        # Express backend + collector API
├── packages/          # Shared configs, types, UI components
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- PostgreSQL
- Redis
- Kafka

### Installation

```bash
git clone <repo-url>
cd webanly
npm install
```

### Environment Variables

Create a `.env` file in each relevant app (`apps/web`, `apps/server`) with database, Redis, Kafka, and Oauth credentials.

### Running Locally

```bash
npm dev
```

This starts all apps in the monorepo via Turborepo.

## Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon (managed PostgreSQL)
- **Redis:** Upstash
- **Kafka:** Aiven

## Known Limitations

- Domain ownership verification is currently email-based only; DNS TXT record verification (for stronger domain-impersonation protection) is a planned enhancement. Schema fields (`verificationToken`, `verifiedAt`) are already in place for this.

