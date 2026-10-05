function extractHostname(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  try {
    const url = new URL(headerValue);
    let hostname = url.hostname.toLowerCase();

    if (hostname.endsWith(".")) {
      hostname = hostname.slice(0, -1);
    }

    return hostname || null;
  } catch {
    return null;
  }
}

function normalizeStoredDomain(storedDomain: string): string | null {
  const value = storedDomain.trim().toLowerCase();

  if (value.length <= 3) {
    return null;
  }

  let domain = value.slice(0, -3);

  if (domain.endsWith(".")) {
    domain = domain.slice(0, -1);
  }

  return domain || null;
}

export function isOriginAllowed(
  originHeader: string | undefined,
  refererHeader: string | undefined,
  storedDomain: string
): boolean {
  const candidate =
    extractHostname(originHeader) ?? extractHostname(refererHeader);

  if (!candidate) {
    return false;
  }

  const normalizedStored = normalizeStoredDomain(storedDomain);

  if (!normalizedStored) {
    return false;
  }

  return candidate === normalizedStored;
}