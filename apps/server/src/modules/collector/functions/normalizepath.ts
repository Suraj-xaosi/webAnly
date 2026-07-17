// src/modules/eventDumping/functions/normalizePath.ts

const NUMERIC_ID = /^\d+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONGO_OBJECT_ID = /^[0-9a-f]{24}$/i;
const LONG_RANDOM_TOKEN = /^[a-zA-Z0-9_-]{16,}$/;
const HEX_ONLY = /^[0-9a-f]{5,}$/i;

// Layer 1: exact-segment ID patterns (numeric, UUID, ObjectId, long random token)
function looksLikeId(segment: string): boolean {
  if (NUMERIC_ID.test(segment)) return true;
  if (UUID.test(segment)) return true;
  if (MONGO_OBJECT_ID.test(segment)) return true;

  // Long generated tokens (nanoid/cuid/firebase-style). Skip if hyphenated —
  // real slugs almost always use hyphens as word separators, generated IDs rarely do.
  if (!segment.includes("-") && LONG_RANDOM_TOKEN.test(segment) && segment.length >= 16) {
    return true;
  }

  return false;
}

// Layer 2: "word-number" patterns — shoe-123, product-8823, order-99213.
// Only replaces the trailing numeric chunk, keeps the rest of the slug intact.
// "how-to-bake-bread" -> last chunk "bread" is NOT numeric -> untouched.
// "top-10-tips"        -> last chunk "tips" is NOT numeric -> untouched.
function stripTrailingNumericId(segment: string): string {
  if (!segment.includes("-")) return segment;

  const chunks = segment.split("-");
  const last = chunks[chunks.length - 1];
  //@ts-ignore
  if (NUMERIC_ID.test(last)) {
    chunks[chunks.length - 1] = ":id";
    return chunks.join("-");
  }

  return segment;
}

// Layer 3: bare hex-looking strings with no hyphen — /p/8f3a92, /x/deadbeef123.
// Requires at least one digit, so real hex-charset words (face, cafe, dead,
// deadbeef) are deliberately left alone — English words don't normally embed digits.
function looksLikeHex(segment: string): boolean {
  if (!HEX_ONLY.test(segment)) return false;
  return /[0-9]/.test(segment);
}

function normalizeSegment(segment: string): string {
  if (looksLikeId(segment)) return ":id";

  const afterHyphenStrip = stripTrailingNumericId(segment);
  if (afterHyphenStrip !== segment) return afterHyphenStrip;

  if (looksLikeHex(segment)) return ":id";

  return segment;
}


export function normalizePath(path: string): string {
  if (!path) return path;

  const segments = path.split("/");

  const normalized = segments.map((segment) => {
    if (segment === "") return segment; // preserve leading/trailing slashes
    return normalizeSegment(segment);
  });

  return normalized.join("/");
}