import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import analyticsReducer from "./slices/analyticsSlice";

export const createStore = () => {
  return configureStore({
    reducer: {
      counter: counterReducer,
      analytics: analyticsReducer,
    },
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
