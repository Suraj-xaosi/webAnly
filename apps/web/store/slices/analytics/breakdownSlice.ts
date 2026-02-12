import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface BreakdownItem {
  name: string;
  views: number;
  visitors: number;
  avgTimeSpent: number | null;
  viewsPerVistor:number| null;
}

export type Dimension =
  | "page"
  | "browser"
  | "device"
  | "country"
  | "os"
  | "referrer";

export interface BreakdownState {
  data: Record<Dimension, BreakdownItem[]>;
  loading: boolean;
  error: string | null;
}

export const initialState: BreakdownState = {
  data: {
    page: [],
    browser: [],
    device: [],
    country: [],
    os: [],
    referrer: [],
  },
  loading: false,
  error: null,
};

export const fetchBreakdown = createAsyncThunk(
  "analytics/fetchBreakdown",
  async ({
    siteId,
    from,
    to,
    dimension,
  }: {
    siteId: string;
    from: string;
    to: string;
    dimension: Dimension;
  }) => {
    const res = await fetch(
      `/api/analytics/breakdown?siteId=${siteId}&from=${from}&to=${to}&dimension=${dimension}`
    );

    if (!res.ok) throw new Error("Failed to fetch breakdown");

    return res.json();
  }
);

export const breakdownSlice = createSlice({
  name: "breakdown",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBreakdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBreakdown.fulfilled, (state, action) => {
        state.loading = false;
        const { dimension, data } = action.payload;
        state.data[dimension as Dimension] = data;
      })
      .addCase(fetchBreakdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error";
      });
  },
});

export default breakdownSlice.reducer;
