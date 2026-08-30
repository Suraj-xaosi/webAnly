import { createSlice, type PayloadAction } from "@reduxjs/toolkit";


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
      state.timezone = action.payload.timezone ?? state.timezone;
    },
    setTimezone(state, action: PayloadAction<string>) {
      state.timezone = action.payload;
    },

  },
});

export const { setDomainId, setDateRange, setTimezone } = dashboardSlice.actions;
export default dashboardSlice.reducer;

import type { RootState } from "../store";

export const selectDomainId = (state: RootState) => state.dashboard.domainId;
export const selectFrom      = (state: RootState) => state.dashboard.from;
export const selectTo        = (state: RootState) => state.dashboard.to;
export const selectInterval  = (state: RootState) => state.dashboard.interval;
export const selectTimezone  = (state: RootState) => state.dashboard.timezone;
export const selectDashboard = (state: RootState) => state.dashboard;