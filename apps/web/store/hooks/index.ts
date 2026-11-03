
"use client"

import { useContext } from "react"
import { AppStoreContext, type AppDispatch, type RootState } from "../store"

export const useAppStore = () => {
  const context = useContext(AppStoreContext)

  if (!context) {
    throw new Error("App store is not available. Wrap the app in StoreProvider.")
  }

  return context
}

export const useAppDispatch = (): AppDispatch => useAppStore().dispatch

export const useAppSelector = <T>(selector: (state: RootState) => T): T => {
  const { state } = useAppStore()
  return selector(state)
}