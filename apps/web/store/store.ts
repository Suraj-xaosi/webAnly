import { configureStore } from "@reduxjs/toolkit";

import selectedDateSiteIdReducer from "./slices/selectedDateSiteSlice";
import siteReducer from "./slices/sitesSlice"
import  breakdownReducer from "./slices/adv/breakdownSlice";

import timeseriesReducer from "./slices/adv/timeseriesSlice";

export const createStore = () => {
  return configureStore({
    reducer: {
      site: siteReducer,
      timeseries:timeseriesReducer,
      selectedDateSiteId: selectedDateSiteIdReducer,
      breakdown: breakdownReducer,
     
    },
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
