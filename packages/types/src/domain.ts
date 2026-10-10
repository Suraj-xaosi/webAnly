import type { DomainState, DomainType } from "@repo/db"

export interface Domain {
  id: string
  userId: string
  domainName: string
  apikey: string
  type: DomainType
  state: DomainState
  endsAt: Date
  deletedAt: Date | null
  defaultTimezone: string
  expectedVisitors: number
  createdAt: Date
  updatedAt: Date
}

export interface DomainSummary {
  id: string
  domainName: string
  state: DomainState
  defaultTimezone: string
  createdAt: Date
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface SessionUser {
  id: string
  email?: string
  name?: string
}
