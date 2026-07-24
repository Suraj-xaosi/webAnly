"use client"

import * as React from "react"
import {
  Globe,
  KeyRound,
  PlusCircle,
  LayoutDashboard,
  Radio,
  BookOpen,
  Sparkles,
} from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

const commandItems = {
  Domain: [
    { label: "Domains & scripts", icon: Globe, href: "/domain#scripts" },
    { label: "Domain API keys", icon: KeyRound, href: "/domain#apikey" },
    { label: "Add & update domain", icon: PlusCircle, href: "/domain#add" },
  ],
  Dashboard: [
    { label: "Analytics dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Live dashboard", icon: Radio, href: "/liveDashboard" },
  ],
  Documentation: [
    { label: "Introduction", icon: BookOpen, href: "/documentation#introduction" },
    { label: "Get Started", icon: Sparkles, href: "/documentation#get-started" },
  ],
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the selected item's href. Pass router.push (or equivalent) from the app layer. */
  onNavigate?: (href: string) => void
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(commandItems).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map(({ label, icon: Icon, href }) => (
                <CommandItem
                  key={label}
                  onSelect={() => {
                    onOpenChange(false)
                    onNavigate?.(href)
                  }}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-heading">{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}