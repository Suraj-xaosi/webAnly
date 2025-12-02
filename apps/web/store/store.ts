import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";

export const createStore = () => {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
  });
};

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
