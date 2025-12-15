import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export type Site = {
  id: string;
  domain: string;
  createdAt: string; 
};

export type SiteState = {
  sites: Site[];
  loading: boolean;
  error: string | null;
};

const initialState: SiteState = {
  sites: [],
  loading: false,
  error: null,
};

export const fetchSiteInfo = createAsyncThunk(
  "site/fetchSiteInfo",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/sites", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err.error || "Failed to load sites");
      }

      const data: Site[] = await res.json();
      return data;
    } catch (error) {
      return rejectWithValue("Network Error");
    }
  }
);

const siteSlice = createSlice({
  name: "site",
  initialState,
  reducers: {

  },

  extraReducers: (builder) => {
    builder

      // Loading
      .addCase(fetchSiteInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // Success
      .addCase(fetchSiteInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.sites = action.payload;
      })

      // Error
      .addCase(fetchSiteInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {  } = siteSlice.actions;

export default siteSlice.reducer;
