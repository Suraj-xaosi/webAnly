
import { createContext } from "react";
import {
  dashboardReducer,
  initialDashboardState,
  setDateRange,
  setDomainId,
  setTimezone,
} from "./slices/dashboardSlice";
import { initialThemeState, setThemeName, themeReducer } from "./slices/themeSlice";
import {
  dimensionTimeseriesReducer,
  initialDimensionTimeseriesState,
  closeDimensionTimeseries,
  openDimensionTimeseries,
} from "./slices/dimensionTimeseriesSlice";

export interface AppState {
  dashboard: typeof initialDashboardState;
  theme: typeof initialThemeState;
  dimensionTimeseries: typeof initialDimensionTimeseriesState;
}

export const initialAppState: AppState = {
  dashboard: initialDashboardState,
  theme: initialThemeState,
  dimensionTimeseries: initialDimensionTimeseriesState,
};

export type AppAction =
  | ReturnType<typeof setDomainId>
  | ReturnType<typeof setDateRange>
  | ReturnType<typeof setTimezone>
  | ReturnType<typeof setThemeName>
  | ReturnType<typeof openDimensionTimeseries>
  | ReturnType<typeof closeDimensionTimeseries>;

export const rootReducer = (
  state: AppState = initialAppState,
  action: AppAction | { type: string; payload?: unknown }
): AppState => ({
  dashboard: dashboardReducer(state.dashboard, action),
  theme: themeReducer(state.theme, action),
  dimensionTimeseries: dimensionTimeseriesReducer(state.dimensionTimeseries, action),
});

export interface AppStoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export type RootState = AppState;
export type AppDispatch = React.Dispatch<AppAction>;