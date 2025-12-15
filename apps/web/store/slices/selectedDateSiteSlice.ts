import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedDateSiteState {
  siteId: string | null;
  fromdate: string | null;
  todate: string | null;
}

export const initialState: SelectedDateSiteState = {
  siteId: null,
  fromdate: null,
  todate: null,
};

export const selectedDateSiteSlice = createSlice({
  name: "selectedDateSiteId",
  initialState,
  reducers: {
    setSiteId(state, action: PayloadAction<string>) {
      state.siteId = action.payload;
    },
    setFromDate(state, action: PayloadAction<string>) {
      state.fromdate = action.payload;
    },
    setToDate(state, action: PayloadAction<string>) {
      state.todate = action.payload;
    },
  },
});

export const { setSiteId, setFromDate, setToDate } =
  selectedDateSiteSlice.actions;

export default selectedDateSiteSlice.reducer;
