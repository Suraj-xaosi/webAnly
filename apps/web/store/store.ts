//web/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";

export const createStore = () => {
  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
    },
  });
};

export type AppStore    = ReturnType<typeof createStore>;
export type RootState   = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];