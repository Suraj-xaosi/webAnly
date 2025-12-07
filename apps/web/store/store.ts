import { configureStore } from "@reduxjs/toolkit";

import analyticsReducer from "./slices/analyticsSlice";
import selectedDateSiteIdReducer from "./slices/selectedDateSiteSlice";
import siteReducer from "./slices/sitesSlice"
export const createStore = () => {
  return configureStore({
    reducer: {
      site: siteReducer,
      analytics: analyticsReducer,
      selectedDateSiteId: selectedDateSiteIdReducer,
      

    },
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
