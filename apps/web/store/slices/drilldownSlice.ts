import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Dimension } from "@/lib/shared/types/analytics";

export interface ActiveDrilldown {
  dimension: Dimension;
  value: string;
  liveMode: boolean;
}

export interface DrilldownState {
  active: ActiveDrilldown | null;
}

const initialState: DrilldownState = {
  active: null,
};

const drilldownSlice = createSlice({
  name: "drilldown",
  initialState,
  reducers: {
    openDrilldown(state, action: PayloadAction<ActiveDrilldown>) {
      state.active = action.payload;
    },
    closeDrilldown(state) {
      state.active = null;
    },
  },
});

export const { openDrilldown, closeDrilldown } = drilldownSlice.actions;
export const selectActiveDrilldown = (state: { drilldown: DrilldownState }) => state.drilldown.active;
export default drilldownSlice.reducer;
