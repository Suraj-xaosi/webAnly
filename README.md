# webAnly: Next-Gen Web Analytics Dashboard

## Overview
webAnly is a powerful, full-stack web analytics platform designed to deliver real-time insights and beautiful data visualizations for website owners and administrators. Built with Next.js, React, Redux Toolkit, and Prisma, webAnly empowers you to monitor, analyze, and optimize your web presence with ease.

## Features
- **User Authentication:** Secure login and session management with NextAuth
- **Multi-Site Analytics:** Add and manage multiple domains, each with its own analytics.
- **Real-Time Data:** Live updates for page views, visitors, and engagement metrics.
- **Interactive Dashboards:** Visualize traffic by browser, device, country, page, and time series using ECharts.
- **Custom Date Ranges:** Filter analytics by hour, day, week, or month.
- **Modern UI:** Responsive, accessible design powered by Tailwind CSS.
- **Modular Monorepo:** TurboRepo-managed monorepo with reusable UI and database packages.

## Architecture
- **Frontend:** Next.js (React), Redux Toolkit, Tailwind CSS, ECharts
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL (or compatible database), kafka queue
- **Authentication:** NextAuth.js with Prisma adapter
- **Monorepo Management:** TurboRepo for efficient builds and workspace management

## Getting Started with Docker

A simple way to run the entire stack using Docker and Docker Compose. 

### Steps
1. **Clone the repository and navigate to the project root:**

	git clone <https://github.com/Suraj-xaosi/webAnly.git>
	cd webAnly

2. **Configure Environment Variables:**
	- Ensure all required `.env` files are present in the respective app and package folders (`apps/web/.env`, `apps/collector/.env`, `apps/worker/.env`, `packages/db/.env`).
	- Update database and Kafka connection strings as needed.
3. **Start the stack:**
	```bash
	docker-compose up --build
	```
	This command will build and start all services: web, collector, worker, PostgreSQL, and Redpanda (Kafka-compatible queue).

    This will take little time.

4. **Access the application:**
	- Web dashboard: [http://localhost:3000](http://localhost:3000)
	- Collector API: [http://localhost:4000](http://localhost:4000)
	- PostgreSQL: localhost:5432 (default credentials in `docker-compose.yaml`)
	- Redpanda (Kafka): localhost:9092








