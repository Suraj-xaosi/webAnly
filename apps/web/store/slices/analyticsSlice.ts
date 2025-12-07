import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface AnalyticsItem {
  name: string;
  views: number;
}

export interface ViewsData {
  interval: string;
  views: number;
}

export interface AnalyticsState {
  browsers: AnalyticsItem[];
  devices: AnalyticsItem[];
  countries: AnalyticsItem[];
  pages: AnalyticsItem[];
  viewsData: ViewsData[];
  loading: boolean;
  error: string | null;
}


const initialState: AnalyticsState = {
  browsers: [],
  devices: [],
  countries: [],
  pages: [],
  viewsData: [],
  loading: false,
  error: null,
};

// -------------------------------
// Fetch Analytics Thunk
// -------------------------------
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (
    params: { siteId: string; date: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(
        `/api/chart?domain=${params.siteId}&date=${params.date}`
      );

      if (!res.ok) {
        const error = await res.json();
        return rejectWithValue(error.error || "Failed to fetch analytics");
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// -------------------------------
// Slice
// -------------------------------
export const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    resetAnalytics(state) {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.browsers = action.payload.browsers;
        state.devices = action.payload.devices;
        state.countries = action.payload.countries;
        state.pages = action.payload.pages;
        state.viewsData = action.payload.viewsData;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
