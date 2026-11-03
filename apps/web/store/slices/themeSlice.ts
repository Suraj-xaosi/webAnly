export const THEME_NAMES = [
  "atelier-deco",
  "spring-notebook",
  "mediterranean",
  "studio-desk",
  "golden-hour",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export interface ThemeState {
  themeName: ThemeName;
}

export const initialThemeState: ThemeState = {
  themeName: "atelier-deco",
};

export type ThemeAction = { type: "theme/setThemeName"; payload: ThemeName };

export const themeReducer = (
  state: ThemeState = initialThemeState,
  action: ThemeAction | { type: string; payload?: unknown }
): ThemeState => {
  switch (action.type) {
    case "theme/setThemeName":
      return { ...state, themeName: (action.payload as ThemeName) ?? state.themeName };
    default:
      return state;
  }
};

export const setThemeName = (payload: ThemeName) => ({
  type: "theme/setThemeName" as const,
  payload,
});

import type { RootState } from "../store";
export const selectThemeName = (state: RootState) => state.theme.themeName;