"use client"

import * as React from "react"
import { Bell, Sun, Moon, Settings, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { CommandPalette } from "@workspace/ui/components/main/commandPalette" // 👈

interface HorizontalNavbarProps {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function HorizontalNavbar({ user }: HorizontalNavbarProps) {
  const [isDark, setIsDark] = React.useState(true)
  const [cmdOpen, setCmdOpen] = React.useState(false) // 👈

  // ⌘K / Ctrl+K keyboard shortcut
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

        {/* Search bar — clicking opens command palette */}
        <button
          onClick={() => setCmdOpen(true)} // 👈
          className="flex flex-1 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground max-w-md hover:bg-muted transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex gap-0.5">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 font-semibold text-xs px-2"
          >
            Get Pro
          </Button>

          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive ring-1 ring-background" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDark(!isDark)}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>

          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="text-xs font-semibold bg-violet-600 text-white">
              {user?.name?.slice(0, 2).toUpperCase() ?? "TB"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Command palette modal */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} /> {/* 👈 */}
    </>
  )
}