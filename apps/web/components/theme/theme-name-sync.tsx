"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectThemeName, setThemeName, THEME_NAMES, type ThemeName } from "@/store/slices/themeSlice"

const STORAGE_KEY = "theme-name"

export function ThemeNameSync() {
  const themeName = useAppSelector(selectThemeName)
  const dispatch = useAppDispatch()
  const isInitialMount = useRef(true)

  useEffect(() => {
    let activeTheme = themeName
 
    if (isInitialMount.current) {
      isInitialMount.current = false
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null
      
      if (saved && THEME_NAMES.includes(saved) && saved !== themeName) {
        dispatch(setThemeName(saved))
        activeTheme = saved 
      }
    }

    document.documentElement.setAttribute("data-theme", activeTheme)
    localStorage.setItem(STORAGE_KEY, activeTheme)
    
  }, [themeName, dispatch])

  return null
}
