import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const today = () => new Date().toISOString().split("T")[0]!;

export type Interval = "hour" | "dayname" | "day" | "week" | "month";

export interface DashboardState {
  domainId: string;
  from:     string;
  to:       string;
  interval: Interval;
  timezone?: string; // optional timezone for the dashboard, can be set by the user 
}

const initialState: DashboardState = {
  domainId: "",
  from:     today(),
  to:       today(),
  interval: "hour",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC", // default timezone is UTC
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
      state.timezone = action.payload.timezone || "UTC"; // set the timezone if provided, otherwise default to UTC
    },
    setTimezone(state, action: PayloadAction<string>) {
      state.timezone = action.payload;
    },
    resetDashboard(state) {
      state.domainId = "";
      state.from     = today();
      state.to       = today();
      state.interval = "hour";
      state.timezone = "UTC";
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