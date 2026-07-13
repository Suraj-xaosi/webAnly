"use client"

import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

interface Domain {
  domainName: string
  id: string
  createdAt: Date
}

interface DomainSwitcherProps {
  domains: Domain[]
  activeDomainId?: string
  onSelect?: (id: string) => void
}

export function DomainSwitcher({ domains, activeDomainId, onSelect }: DomainSwitcherProps) {
  const { isMobile } = useSidebar()
  const [internalActiveDomain, setInternalActiveDomain] = React.useState(domains[0])

  // Prefer Redux-driven activeDomainId when provided, otherwise fall back to internal state
  const activeDomain = activeDomainId
    ? domains.find((d) => d.id === activeDomainId) ?? internalActiveDomain
    : internalActiveDomain

  if (!activeDomain) {
    return null
  }

  const getDomainInitial = (domainName: string) => domainName.charAt(0).toUpperCase()

  const handleSelect = (domain: Domain) => {
    setInternalActiveDomain(domain)
    onSelect?.(domain.id)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {getDomainInitial(activeDomain.domainName)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-medium">{activeDomain.domainName}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Domains
            </DropdownMenuLabel>
            {domains.map((domain, index) => (
              <DropdownMenuItem
                key={domain.id}
                onClick={() => handleSelect(domain)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  {getDomainInitial(domain.domainName)}
                </div>
                <span className="font-heading">{domain.domainName}</span>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add domain</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}