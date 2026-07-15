// store/slices/themeSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeName =
  | "atelier-deco"
  | "spring-notebook"
  | "mediterranean"
  | "studio-desk"
  | "golden-hour";

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

// ── Selectors ────────────────────────────────────────────────────────────────
import type { RootState } from "../store";

export const selectThemeName = (state: RootState) => state.theme.themeName;