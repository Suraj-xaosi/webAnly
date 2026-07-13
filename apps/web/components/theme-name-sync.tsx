"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectThemeName, setThemeName, type ThemeName } from "@/store/slices/themeSlice"

const STORAGE_KEY = "theme-name"
const VALID_THEMES: ThemeName[] = ["artdeco", "ocean", "sunset", "monochrome"]

export function ThemeNameSync() {
  const themeName = useAppSelector(selectThemeName)
  const dispatch = useAppDispatch()

  // On mount: restore whatever the user picked last time
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    if (saved && VALID_THEMES.includes(saved) && saved !== themeName) {
      dispatch(setThemeName(saved))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Whenever the theme changes: apply it to <html> and persist it
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeName)
    localStorage.setItem(STORAGE_KEY, themeName)
  }, [themeName])

  return null
}