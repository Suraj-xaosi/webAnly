// apps/web/store/slices/themeSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Single source of truth — sirf yahan naya theme add/remove hoga
export const THEME_NAMES = [
  "atelier-deco",
  "spring-notebook",
  "mediterranean",
  "studio-desk",
  "golden-hour",
] as const;

// Type ab array se automatically derive hota hai — manually likhna nahi padega
export type ThemeName = typeof THEME_NAMES[number];

export interface ThemeState {
  themeName: ThemeName;
}

const initialState: ThemeState = {
  themeName: "atelier-deco",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setThemeName(state, action: PayloadAction<ThemeName>) {
      state.themeName = action.payload;
    },
  },
});

export const { setThemeName } = themeSlice.actions;
export default themeSlice.reducer;

import type { RootState } from "../store";
export const selectThemeName = (state: RootState) => state.theme.themeName;