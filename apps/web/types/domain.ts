import type { DomainState } from "@repo/db"

export interface Domain {
  id: string
  userId: string
  domainName: string
  apikey: string
  state: DomainState
  endsAt: Date
  deletedAt: Date | null
  defaultTimezone: string
  expectedVisitors: number
  createdAt: Date
  updatedAt: Date
}
