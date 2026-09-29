
import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";
import themeReducer from "./slices/themeSlice";
import dimensionTimeseriesReducer from "./slices/dimensionTimeseriesSlice";

export const createStore = () => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
      theme: themeReducer,
      dimensionTimeseries: dimensionTimeseriesReducer,
    },
  });
};

export type AppStore    = ReturnType<typeof createStore>;
export type RootState   = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];