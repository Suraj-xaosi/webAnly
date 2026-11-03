
import { createContext, type Dispatch } from "react";
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

export type AppStore = {
  getState: () => AppState;
  dispatch: Dispatch<AppAction>;
  subscribe: (listener: () => void) => () => void;
};

export const createStore = (): AppStore => {
  let state = initialAppState;
  const listeners = new Set<() => void>();

  const dispatch: Dispatch<AppAction> = (action) => {
    state = rootReducer(state, action as AppAction);
    listeners.forEach((listener) => listener());
    return action;
  };

  return {
    getState: () => state,
    dispatch,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export interface AppStoreContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export type RootState = AppState;
export type AppDispatch = Dispatch<AppAction>;