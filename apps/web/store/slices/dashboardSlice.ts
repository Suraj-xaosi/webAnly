function todayInZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

export type Interval = "hour" | "dayname" | "day" | "week" | "month";

export interface DashboardState {
  domainId: string;
  from: string;
  to: string;
  interval: Interval;
  timezone?: string;
  timezoneResolved: boolean;
}

export const initialDashboardState: DashboardState = {
  domainId: "",
  from: todayInZone("UTC"),
  to: todayInZone("UTC"),
  interval: "hour",
  timezone: "UTC",
  timezoneResolved: false,
};

export type DashboardAction =
  | { type: "dashboard/setDomainId"; payload: string }
  | {
      type: "dashboard/setDateRange";
      payload: { from: string; to: string; interval: Interval; timezone?: string };
    }
  | { type: "dashboard/setTimezone"; payload: string };

export const dashboardReducer = (
  state: DashboardState = initialDashboardState,
  action: DashboardAction | { type: string; payload?: unknown }
): DashboardState => {
  switch (action.type) {
    case "dashboard/setDomainId":
      return { ...state, domainId: String(action.payload ?? "") };
    case "dashboard/setDateRange": {
      const payload = action.payload as {
        from: string;
        to: string;
        interval: Interval;
        timezone?: string;
      };
      return {
        ...state,
        from: payload.from,
        to: payload.to,
        interval: payload.interval,
        timezone: payload.timezone ?? state.timezone,
      };
    }
    case "dashboard/setTimezone":
      return {
        ...state,
        timezone: String(action.payload ?? "UTC"),
        timezoneResolved: true,
      };
    default:
      return state;
  }
};

export const setDomainId = (payload: string) => ({
  type: "dashboard/setDomainId" as const,
  payload,
});

export const setDateRange = (payload: {
  from: string;
  to: string;
  interval: Interval;
  timezone?: string;
}) => ({
  type: "dashboard/setDateRange" as const,
  payload,
});

export const setTimezone = (payload: string) => ({
  type: "dashboard/setTimezone" as const,
  payload,
});

import type { RootState } from "../store";

export const selectDomainId = (state: RootState) => state.dashboard.domainId;
export const selectFrom = (state: RootState) => state.dashboard.from;
export const selectTo = (state: RootState) => state.dashboard.to;
export const selectInterval = (state: RootState) => state.dashboard.interval;
export const selectTimezone = (state: RootState) => state.dashboard.timezone;
export const selectTimezoneResolved = (state: RootState) => state.dashboard.timezoneResolved;
export const selectDashboard = (state: RootState) => state.dashboard;