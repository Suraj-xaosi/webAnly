// Centralized read of every NEXT_PUBLIC_ env var — these are meant to ship
// in client bundles, so no "server-only" guard is needed here.
// If a value here is ever undefined/wrong at runtime, this is the one file
// to check first — every entry below lists exactly which file uses it.

export const publicEnv = {
  // apps/web/lib/auth-client.ts — better-auth client base URL
  NEXT_PUBLIC_BETTER_AUTH_BASE_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL,

  // apps/web/components/domain/domainScriptsSection.tsx — the tracking
  // script src shown to users in the copyable code snippet
  NEXT_PUBLIC_COLLECTOR_SCRIPT_URL: process.env.NEXT_PUBLIC_COLLECTOR_SCRIPT_URL,

  // apps/web/hooks/realtime/useWebSocket.ts — realtime WebSocket server URL
  NEXT_PUBLIC_WSS_URL: process.env.NEXT_PUBLIC_WSS_URL,
}