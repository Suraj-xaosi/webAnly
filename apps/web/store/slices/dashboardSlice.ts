import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const today = () => new Date().toISOString().split("T")[0]!;

export type Interval = "hour" | "dayname" | "day" | "week" | "month";

export interface DashboardState {
  domainId: string;
  from:     string;
  to:       string;
  interval: Interval;
}

const initialState: DashboardState = {
  domainId: "",
  from:     today(),
  to:       today(),
  interval: "hour",
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
      action: PayloadAction<{ from: string; to: string; interval: Interval }>
    ) {
      state.from     = action.payload.from;
      state.to       = action.payload.to;
      state.interval = action.payload.interval;
    },
    resetDashboard(state) {
      state.domainId = "";
      state.from     = today();
      state.to       = today();
      state.interval = "hour";
    },
  },
});

export const { setDomainId, setDateRange, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

import type { RootState } from "../store";

export const selectDomainId = (state: RootState) => state.dashboard.domainId;
export const selectFrom      = (state: RootState) => state.dashboard.from;
export const selectTo        = (state: RootState) => state.dashboard.to;
export const selectInterval  = (state: RootState) => state.dashboard.interval;
export const selectDashboard = (state: RootState) => state.dashboard;