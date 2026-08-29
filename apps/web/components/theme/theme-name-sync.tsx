"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectThemeName, setThemeName, THEME_NAMES, type ThemeName } from "@/store/slices/themeSlice"

const STORAGE_KEY = "theme-name"
// VALID_THEMES local array hata diya — ab THEME_NAMES directly use karo

export function ThemeNameSync() {
  const themeName = useAppSelector(selectThemeName)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    if (saved && THEME_NAMES.includes(saved as ThemeName) && saved !== themeName) {
      dispatch(setThemeName(saved))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeName)
    localStorage.setItem(STORAGE_KEY, themeName)
  }, [themeName])

  return null
}