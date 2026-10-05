//apps/packages/ui/components/horizontalnavabar.tsx
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { CommandPalette } from "@workspace/ui/components/main/commandPalette"

interface HorizontalNavbarProps {
  user?: {
    name: string
    email: string
    avatar: string
  }
  themeSwitcher?: React.ReactNode
  notificationBell?: React.ReactNode
  onNavigate?: (href: string) => void
}

export function HorizontalNavbar({
  user,
  themeSwitcher,
  notificationBell,
  onNavigate,
}: HorizontalNavbarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />

        <button
          onClick={() => setCmdOpen(true)}
          className="flex max-w-md min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left font-heading">Search...</span>
          <kbd className="pointer-events-none hidden gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground select-none sm:inline-flex">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {notificationBell}
          {themeSwitcher}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-primary font-heading text-xs font-semibold text-primary-foreground">
              {mounted ? (user?.name?.slice(0, 2).toUpperCase() ?? "TB") : "TB"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onNavigate={onNavigate}
      />
    </>
  )
}
