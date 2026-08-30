"use client"

import { Palette, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectThemeName, setThemeName, THEME_NAMES, type ThemeName } from "@/store/slices/themeSlice"


const THEME_LABELS: Record<ThemeName, string> = {
  "atelier-deco": "Atelier Deco",
  "spring-notebook": "Spring Notebook",
  "mediterranean": "Mediterranean Sketchbook",
  "studio-desk": "Studio Desk",
  "golden-hour": "Golden Hour",
};

export function ThemeSwitcher() {
  const dispatch = useAppDispatch()
  const themeName = useAppSelector(selectThemeName)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_NAMES.map((id) => (
          <DropdownMenuItem key={id} onClick={() => dispatch(setThemeName(id))}>
            <span className="flex-1">{THEME_LABELS[id]}</span>
            {themeName === id && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}