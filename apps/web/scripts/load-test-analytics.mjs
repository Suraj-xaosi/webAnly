#!/usr/bin/env node

const MAX_REQUESTS = 10_000
const MAX_CONCURRENCY = 50
const LOAD_TEST_DOMAIN_ID = "0"
const DEFAULT_ROUTES = [
  "timeseries",
  "flow",
  "exit-pages",
  "dimensions",
  "dimension-timeseries",
]
const ROUTE_PATHS = {
  timeseries: "/api/analytics/timeseries",
  flow: "/api/analytics/flow",
  "exit-pages": "/api/analytics/exit-pages",
  dimensions: "/api/analytics/dimensions",
  "dimension-timeseries": "/api/analytics/dimension-timeseries",
}

function usage() {
  console.log(`Analytics endpoint load tester (finite request count)

Usage:
  npm run loadtest:analytics -- --base-url http://localhost:3000 --domain-id ID [options]

Required:
  --base-url URL             Server origin (remote targets must use HTTPS)
  --domain-id ID             Use "0" for the unauthenticated dummy test domain
  ANALYTICS_LOAD_TEST_COOKIE Auth cookie for any other domain ID

Options:
  --requests N               Total requests (default 200, max ${MAX_REQUESTS})
  --concurrency N            Simultaneous requests (default 10, max ${MAX_CONCURRENCY})
  --routes LIST              Comma-separated route names; default all five
  --from YYYY-MM-DD          Start date (default: two days ago, UTC)
  --to YYYY-MM-DD            End date (default: yesterday, UTC)
  --timezone IANA_NAME       Default UTC
  --interval INTERVAL        Default day
  --page PATH                Flow page (default /)
  --dimension NAME           Dimension-timeseries dimension (default page)
  --value VALUE              Dimension-timeseries value (default /)
  --timeout-ms N             Per-request timeout (default 30000)
  --allow-remote             Required to test a non-local HTTPS server
  --help                     Show this help

Only analytics routes are called. Any cookie is read from the environment and
never printed. This script does not log in or change data.
`)
}

function parseArgs(argv) {
  const options = {}
  const booleanOptions = new Set(["allow-remote", "help"])

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`)
    const name = arg.slice(2)
    if (booleanOptions.has(name)) {
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

function utcDateOffset(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function assertDate(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`${name} must use YYYY-MM-DD`)
  }
}

function buildUrl(baseUrl, route, config) {
  const url = new URL(ROUTE_PATHS[route], baseUrl)
  url.searchParams.set("domainId", config.domainId)
  url.searchParams.set("from", config.from)
  url.searchParams.set("to", config.to)
  url.searchParams.set("timezone", config.timezone)

  if (route === "timeseries" || route === "dimension-timeseries") {
    url.searchParams.set("interval", config.interval)
  }
  if (route === "flow") url.searchParams.set("page", config.page)
  if (route === "dimension-timeseries") {
    url.searchParams.set("dimension", config.dimension)
    url.searchParams.set("value", config.value)
  }
  return url
}

async function consumeResponse(response) {
  if (!response.body) return ""
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let excerpt = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (excerpt.length < 500) {
      excerpt += decoder.decode(value, { stream: true }).slice(0, 500 - excerpt.length)
    }
  }
  return excerpt
}

function percentile(samples, value) {
  if (samples.length === 0) return 0
  const index = Math.ceil((value / 100) * samples.length) - 1
  return samples[Math.max(0, index)]
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    usage()
    return
  }

  const baseUrlValue = options["base-url"] || process.env.ANALYTICS_LOAD_TEST_BASE_URL
  const domainId = options["domain-id"] || process.env.ANALYTICS_LOAD_TEST_DOMAIN_ID
  const cookie = process.env.ANALYTICS_LOAD_TEST_COOKIE
  if (!baseUrlValue || !domainId || (!cookie && domainId !== LOAD_TEST_DOMAIN_ID)) {
    throw new Error("Provide --base-url and --domain-id; non-test domains also require ANALYTICS_LOAD_TEST_COOKIE")
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
  if (baseUrl.pathname !== "/") baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/`

  const requestCount = positiveInteger(options.requests || "200", "--requests", MAX_REQUESTS)
  const concurrency = positiveInteger(options.concurrency || "10", "--concurrency", MAX_CONCURRENCY)
  const timeoutMs = positiveInteger(options["timeout-ms"] || "30000", "--timeout-ms", 120_000)
  const routes = options.routes ? options.routes.split(",").map((route) => route.trim()) : DEFAULT_ROUTES
  if (routes.length === 0 || routes.some((route) => !Object.hasOwn(ROUTE_PATHS, route))) {
    throw new Error(`--routes must contain names from: ${Object.keys(ROUTE_PATHS).join(", ")}`)
  }

  const config = {
    domainId,
    from: options.from || utcDateOffset(-2),
    to: options.to || utcDateOffset(-1),
    timezone: options.timezone || "UTC",
    interval: options.interval || "day",
    page: options.page || "/",
    dimension: options.dimension || "page",
    value: options.value || "/",
  }
  assertDate(config.from, "--from")
  assertDate(config.to, "--to")

  const results = []
  let nextIndex = 0
  const startedAt = Date.now()
  console.log(`Sending ${requestCount} request(s), concurrency ${concurrency}, routes: ${routes.join(", ")}`)

  async function worker() {
    while (true) {
      const requestIndex = nextIndex
      nextIndex += 1
      if (requestIndex >= requestCount) return

      const route = routes[requestIndex % routes.length]
      const url = buildUrl(baseUrl, route, config)
      const started = performance.now()
      try {
        const headers = {}
        if (cookie) headers.cookie = cookie

        const response = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(timeoutMs),
        })
        const excerpt = await consumeResponse(response)
        results.push({
          route,
          status: response.status,
          durationMs: performance.now() - started,
          error: response.ok ? null : excerpt,
        })
      } catch (error) {
        results.push({
          route,
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
      console.log(`  ${failure.route} ${failure.status}: ${(failure.error || "").replace(/\s+/g, " ").slice(0, 200)}`)
    }
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  console.error("Use --help for usage.")
  process.exitCode = 1
})
