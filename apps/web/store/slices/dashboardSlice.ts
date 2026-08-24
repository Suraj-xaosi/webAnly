import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Timezone-safe "today" — never toISOString() (always UTC), and never a bare
// new Date() + local format (depends on whatever TZ this module happens to
// evaluate in, server or browser). en-CA locale formats straight to YYYY-MM-DD.
function todayInZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

export type Interval = "hour" | "dayname" | "day" | "week" | "month";

export interface DashboardState {
  domainId: string;
  from:     string;
  to:       string;
  interval: Interval;
  timezone?: string;
}

// NOTE: this module may be evaluated server-side during SSR, where Intl
// reflects the server's timezone, not the visitor's. "UTC" here is a
// deliberate, safe placeholder — TimezonePicker corrects both timezone
// and from/to together, once, after the real browser timezone is known.
const initialState: DashboardState = {
  domainId: "",
  from:     todayInZone("UTC"),
  to:       todayInZone("UTC"),
  interval: "hour",
  timezone: "UTC",
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setDomainId(state, action: PayloadAction<string>) {
      state.domainId = action.payload;
    },
    setDateRange(
      state,
      action: PayloadAction<{ from: string; to: string; interval: Interval; timezone?: string }>
    ) {
      state.from     = action.payload.from;
      state.to       = action.payload.to;
      state.interval = action.payload.interval;
      // Only touch timezone if this call explicitly provides one.
      // Previously this defaulted to "UTC" whenever omitted, which
      // silently reset the user's real timezone on every date-range
      // Apply (DateRangePicker's onApply never sends one).
      state.timezone = action.payload.timezone ?? state.timezone;
    },
    setTimezone(state, action: PayloadAction<string>) {
      state.timezone = action.payload;
    },
    resetDashboard(state) {
      const tz = state.timezone || "UTC";
      state.domainId = "";
      state.from     = todayInZone(tz);
      state.to       = todayInZone(tz);
      state.interval = "hour";
      // timezone intentionally left as-is — reset shouldn't force UTC either
    },
  },
});

export const { setDomainId, setDateRange, setTimezone, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

import type { RootState } from "../store";

export const selectDomainId = (state: RootState) => state.dashboard.domainId;
export const selectFrom      = (state: RootState) => state.dashboard.from;
export const selectTo        = (state: RootState) => state.dashboard.to;
export const selectInterval  = (state: RootState) => state.dashboard.interval;
export const selectTimezone  = (state: RootState) => state.dashboard.timezone;
export const selectDashboard = (state: RootState) => state.dashboard;