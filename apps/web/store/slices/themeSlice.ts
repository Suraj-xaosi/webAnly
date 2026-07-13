import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeName = "artdeco" | "ocean" | "sunset" | "monochrome";

export interface ThemeState {
  themeName: ThemeName;
}

const initialState: ThemeState = {
  themeName: "artdeco",
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