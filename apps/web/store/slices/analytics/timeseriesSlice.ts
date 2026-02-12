import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface TimeseriesPoint {
  date: string;
  views: number;
  visitors: number;
}

export interface TimeseriesState {
  data: TimeseriesPoint[];
  loading: boolean;
  error: string | null;
}

export const initialState: TimeseriesState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchTimeseries = createAsyncThunk(
  "analytics/fetchTimeseries",
  async ({
    siteId,
    from,
    to,
    interval,
  }: {
    siteId: string;
    from: string;
    to: string;
    interval: "hour" |"day" | "week" | "month";
  }) => {
    const res = await fetch(
      `/api/analytics/timeseries?siteId=${siteId}&from=${from}&to=${to}&interval=${interval}`
    );

    if (!res.ok) throw new Error("Failed to fetch timeseries");

    return res.json();
  }
);

export const timeseriesSlice = createSlice({
  name: "timeseries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeseries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeseries.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
      })
      .addCase(fetchTimeseries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error";
      });
  },
});

export default timeseriesSlice.reducer;
