import "server-only"

// Centralized read of every server-only (non-NEXT_PUBLIC_) env var.
// The "server-only" import above is the actual protection: if this file
// ever gets pulled into a client bundle, the build fails loudly. This is
// If a value here is ever undefined/wrong at runtime, this is the one file
// to check first — every entry below lists exactly which file(s) use it.

export const env = {
  // apps/web/lib/auth.ts — GitHub OAuth provider config
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID as string,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET as string,

}