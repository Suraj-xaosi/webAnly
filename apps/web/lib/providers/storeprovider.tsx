"use client"

import { type ReactNode, useReducer } from "react"
import { AppStoreContext, initialAppState, rootReducer } from "../../store/store"
import { ThemeNameSync } from "@/components/theme/theme-name-sync"

const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(rootReducer, initialAppState)

  return (
    <AppStoreContext.Provider value={{ state, dispatch }}>
      <ThemeNameSync />
      {children}
    </AppStoreContext.Provider>
  )
}

export default StoreProvider
