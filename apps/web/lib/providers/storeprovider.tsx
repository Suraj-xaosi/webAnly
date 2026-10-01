"use client"

import { AppStore, createStore } from "../../store/store"
import { ReactNode, useRef } from "react"
import { Provider } from "react-redux"
import { ThemeNameSync } from "@/components/theme/theme-name-sync"

const StoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<AppStore>(undefined)
  if (!storeRef.current) {
    storeRef.current = createStore()
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeNameSync />
      {children}
    </Provider>
  )
}

export default StoreProvider
