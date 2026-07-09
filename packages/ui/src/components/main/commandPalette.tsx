"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Hotel,
  FolderKanban,
  Building2,
  BarChart2,
  Users,
  FileText,
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
  Dashboards: [
    { label: "Classic Dashboard", icon: LayoutDashboard, href: "#" },
    { label: "E-commerce", icon: ShoppingCart, href: "#" },
    { label: "Payment Dashboard", icon: CreditCard, href: "#" },
    { label: "Hotel Dashboard", icon: Hotel, href: "#" },
    { label: "Project Management", icon: FolderKanban, href: "#" },
    { label: "Real Estate", icon: Building2, href: "#" },
    { label: "Sales", icon: BarChart2, href: "#" },
    { label: "CRM", icon: Users, href: "#" },
  ],
  Pages: [
    { label: "Analytics Overview", icon: BarChart2, href: "#" },
    { label: "Reports", icon: FileText, href: "#" },
  ],
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
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
                  // router.push(href) — add next/navigation if needed
                }}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      </Command> 
    </CommandDialog>
  )
}