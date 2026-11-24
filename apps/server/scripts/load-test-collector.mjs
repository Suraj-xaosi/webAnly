#!/usr/bin/env node

import { randomUUID } from "node:crypto"

const MAX_REQUESTS = 10_000
const MAX_CONCURRENCY = 25
const PAGE_NAMES = ["pricing", "docs", "features", "blog", "contact"]
const BROWSERS = ["Chrome", "Firefox", "Safari", "Edge"]
const DEVICES = ["Desktop", "Mobile", "Tablet"]
const OPERATING_SYSTEMS = ["Windows", "macOS", "Linux", "Android", "iOS"]
const TIMEZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata"]
const EXIT_TYPES = ["navigation", "pagehide", "hidden"]

function usage() {
  console.log(`Collector load tester (domain 0 API key)

Usage:
  npm run loadtest:collector --workspace=server -- --base-url http://localhost:4000 --origin https://your-site.example --requests 200 --concurrency 5

Required:
  --base-url URL         Collector server origin
  --origin URL           Site origin matching the domain's registered hostname
  ANALYTICS_LOAD_TEST_API_KEY
                         API key belonging to domain ID 0

Options:
  --requests N           Total POSTs (default 200, max ${MAX_REQUESTS})
  --concurrency N        Simultaneous POSTs (default 5, max ${MAX_CONCURRENCY})
  --timeout-ms N         Per-request timeout (default 30000)
  --allow-remote         Required for a non-local HTTPS server
  --help                 Show this help

Each request inserts a new page-visit row with randomized event data.
`)
}

function parseArgs(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`)
    const name = arg.slice(2)
    if (name === "help" || name === "allow-remote") {
      options[name] = true
      continue
    }
    if (index + 1 >= argv.length || argv[index + 1].startsWith("--")) {
      throw new Error(`Missing value for --${name}`)
    }
    options[name] = argv[index + 1]
    index += 1
  }
  return options
}

function positiveInteger(value, name, maximum) {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be an integer from 1 to ${maximum}`)
  }
  return parsed
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function buildEvent(apiKey, index) {
  const pageName = pick(PAGE_NAMES)
  return {
    apikey: apiKey,
    page: `/load-test/${pageName}`,
    visitorId: randomUUID(),
    pageTitle: `Load test ${pageName} ${index}`,
    referrer: Math.random() < 0.5 ? "https://search.example/" : null,
    browser: pick(BROWSERS),
    device: pick(DEVICES),
    os: pick(OPERATING_SYSTEMS),
    timezone: pick(TIMEZONES),
    visitedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1_000)).toISOString(),
    timeSpent: Math.floor(Math.random() * 600) + 1,
    exitType: pick(EXIT_TYPES),
  }
}

function percentile(samples, value) {
  if (samples.length === 0) return 0
  return samples[Math.max(0, Math.ceil((value / 100) * samples.length) - 1)]
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    usage()
    return
  }

  const baseUrlValue = options["base-url"] || process.env.ANALYTICS_LOAD_TEST_BASE_URL
  const originValue = options.origin || process.env.ANALYTICS_LOAD_TEST_ORIGIN
  const apiKey = process.env.ANALYTICS_LOAD_TEST_API_KEY
  if (!baseUrlValue || !originValue || !apiKey) {
    throw new Error("Provide --base-url, --origin, and ANALYTICS_LOAD_TEST_API_KEY")
  }

  const baseUrl = new URL(baseUrlValue)
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname)
  if (baseUrl.protocol !== "https:" && !(isLocal && baseUrl.protocol === "http:")) {
    throw new Error("Use HTTPS for remote servers; HTTP is allowed only for localhost")
  }
  if (!isLocal && !options["allow-remote"]) {
    throw new Error("Remote testing requires --allow-remote")
  }
  if (baseUrl.search || baseUrl.hash) {
    throw new Error("--base-url must not contain a query string or fragment")
  }

  const origin = new URL(originValue)
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error("--origin must be an HTTP(S) site origin")
  }
  const requestCount = positiveInteger(options.requests || "200", "--requests", MAX_REQUESTS)
  const concurrency = positiveInteger(options.concurrency || "5", "--concurrency", MAX_CONCURRENCY)
  const timeoutMs = positiveInteger(options["timeout-ms"] || "30000", "--timeout-ms", 120_000)
  const endpoint = new URL("/collect", baseUrl)
  const results = []
  let nextIndex = 0
  const startedAt = Date.now()

  console.log(`Sending ${requestCount} collector event(s) to domain 0, concurrency ${concurrency}`)

  async function worker() {
    while (true) {
      const requestIndex = nextIndex
      nextIndex += 1
      if (requestIndex >= requestCount) return

      const started = performance.now()
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: origin.origin,
          },
          body: JSON.stringify(buildEvent(apiKey, requestIndex + 1)),
          signal: AbortSignal.timeout(timeoutMs),
        })
        const responseText = await response.text()
        results.push({
          status: response.status,
          durationMs: performance.now() - started,
          error: response.ok ? null : responseText,
        })
      } catch (error) {
        results.push({
          status: "ERR",
          durationMs: performance.now() - started,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestCount) }, () => worker())
  )

  const durationSeconds = (Date.now() - startedAt) / 1_000
  const durations = results.map((result) => result.durationMs).sort((a, b) => a - b)
  const statusCounts = new Map()
  for (const result of results) {
    statusCounts.set(result.status, (statusCounts.get(result.status) || 0) + 1)
  }

  console.log(`\nCompleted ${results.length} requests in ${durationSeconds.toFixed(2)}s (${(results.length / durationSeconds).toFixed(2)} req/s)`)
  console.log(`Latency ms: p50 ${percentile(durations, 50).toFixed(1)}, p95 ${percentile(durations, 95).toFixed(1)}, max ${(durations.at(-1) || 0).toFixed(1)}`)
  console.log("Status counts:")
  for (const [status, count] of [...statusCounts].sort(([a], [b]) => String(a).localeCompare(String(b)))) {
    console.log(`  ${status}: ${count}`)
  }

  const failures = results.filter((result) => result.status === "ERR" || result.status >= 400)
  if (failures.length > 0) {
    console.log("Sample failures:")
    for (const failure of failures.slice(0, 5)) {
      console.log(`  ${failure.status}: ${(failure.error || "").replace(/\s+/g, " ").slice(0, 200)}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  console.error("Use --help for usage.")
  process.exitCode = 1
})
