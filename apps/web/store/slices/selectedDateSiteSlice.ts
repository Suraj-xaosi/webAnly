import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SelectedDateSiteIdState {
  date: string | null;
  siteId: string | null;
}

export const initialState: SelectedDateSiteIdState = {
  date: null,
  siteId: null,
};

export const selectedDateSiteIdSlice = createSlice({
  name: "selectedDateSiteId",
  initialState,
  reducers: {
    setDate(state, action: PayloadAction<string | null>) {
      state.date = action.payload;
    },
    setSiteId(state, action: PayloadAction<string | null>) {
      state.siteId = action.payload;
    },
    resetSelection(state) {
      state.date = null;
      state.siteId = null;
    },
  },
});

export const { setDate, setSiteId, resetSelection } =
  selectedDateSiteIdSlice.actions;

export default selectedDateSiteIdSlice.reducer;
