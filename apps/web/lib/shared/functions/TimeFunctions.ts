import { NextResponse } from "next/server";

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const CACHE_TTL_TODAY = 30;   // seconds — "today" data still accumulating
export const CACHE_TTL_PAST  = 600;  // seconds — past data is immutable history

export function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function todayInTimeZone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}


export function validateDateParams(
  from: string | null,
  to: string | null,
  timezone: string
): NextResponse | null {
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  if (!isValidTimeZone(timezone)) {
    return NextResponse.json(
      { error: "Invalid timezone. Use an IANA name like 'Asia/Kolkata'." },
      { status: 400 }
    );
  }

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const fromCheck = new Date(`${from}T00:00:00.000Z`);
  const toCheck = new Date(`${to}T00:00:00.000Z`);
  if (isNaN(fromCheck.getTime()) || isNaN(toCheck.getTime()) || fromCheck > toCheck) {
    return NextResponse.json({ error: "'from' must be before or equal to 'to'" }, { status: 400 });
  }

  return null; 
}
