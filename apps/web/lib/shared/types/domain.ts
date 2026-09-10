import type { DomainType, DomainState } from "@repo/db"

// Domain/project model type — mirrors the Prisma `Domain` model.
// Comes from getDomain.ts, a server action — Date fields arrive as real
// Date objects in the browser (server actions preserve Date, unlike a
// fetch()/NextResponse.json() API route which would serialize to strings).
export interface Domain {
  id: string;
  userId: string;
  domainName: string;
  apikey: string;
  type: DomainType;
  state: DomainState;
  endsAt: Date;
  deletedAt: Date | null;
  defaultTimezone: string;
  expectedVisitors: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;   
}

// Session/User types (extend as needed)
export interface SessionUser {
  id: string;
  email?: string;
  name?: string;
}