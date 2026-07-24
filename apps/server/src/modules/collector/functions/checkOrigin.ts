// src/modules/collector/functions/checkOrigin.ts

/**
 * Extracts a bare, comparable hostname from an Origin or Referer header value.
 * "https://www.webanly.com:443/foo?x=1" -> "webanly.com"
 */
function extractHostname(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  try {
    const url = new URL(headerValue);
    let hostname = url.hostname.toLowerCase();

    // strip a leading "www." so "webanly.com" and "www.webanly.com" are
    // treated as the same site
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    // Origin/Referer wasn't a valid absolute URL — treat as unusable
    return null;
  }
}

/**
 * Compares the request's Origin/Referer against the stored domainName.
 * storedDomain is expected to be a bare hostname like "webanly.com" or
 * "shop.webanly.in" — whatever the customer registered.
 */
export function isOriginAllowed(
  originHeader: string | undefined,
  refererHeader: string | undefined,
  storedDomain: string
): boolean {
  const candidate = extractHostname(originHeader) ?? extractHostname(refererHeader);

  if (!candidate) return false; // no usable header at all — reject

  const normalizedStored = storedDomain.toLowerCase().startsWith("www.")
    ? storedDomain.toLowerCase().slice(4)
    : storedDomain.toLowerCase();

  return candidate === normalizedStored;
}