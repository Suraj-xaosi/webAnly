"use client"

import { Palette, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectThemeName, setThemeName, type ThemeName } from "@/store/slices/themeSlice"

const THEMES: { id: ThemeName; label: string }[] = [
  { id: "artdeco",    label: "Art Deco" },
  { id: "ocean",      label: "Ocean" },
  { id: "sunset",     label: "Sunset" },
  { id: "monochrome", label: "Monochrome" },
]

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
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => dispatch(setThemeName(t.id))}>
            <span className="flex-1">{t.label}</span>
            {themeName === t.id && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}