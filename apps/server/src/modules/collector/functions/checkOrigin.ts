
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


export function isOriginAllowed(
  originHeader: string | undefined,
  refererHeader: string | undefined,
  storedDomain: string
): boolean {
  const candidate = extractHostname(originHeader) ?? extractHostname(refererHeader);

  if (!candidate) return false; // no usable header at all — reject

  const storedWithoutMarker = storedDomain.toLowerCase().slice(0, -3);// because there are 3 characters added to the end of the domain name, we need to remove them before comparing
  const normalizedStored = storedWithoutMarker.startsWith("www.")
    ? storedWithoutMarker.slice(4)
    : storedWithoutMarker;

  return candidate === normalizedStored;
}