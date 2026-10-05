//apps/packages/ui/src/components/main/app-sidebar.tsx
"use client"

import * as React from "react"

import { NavMain } from "@workspace/ui/components/nav-main"
import { NavUser } from "@workspace/ui/components/nav-user"
import { SidebarBrand } from "@workspace/ui/components/sidebarBrand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { TerminalSquareIcon, BotIcon, BookOpenIcon } from "lucide-react"

const data = {
  brand: {
    name: "WebAnly",
  },
  navMain: [
    {
      title: "Domain",
      url: "/domain",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        { title: "Domains & Scripts", url: "/domain#scripts" },
        { title: "Domain - Apikey", url: "/domain#apikey" },
        { title: "Add Domain", url: "/domain#add" },
      ],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <BotIcon />,
      items: [
        { title: "Analytics Dashboard", url: "/dashboard" },
        { title: "Live Dashboard", url: "/liveDashboard" },
      ],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: <BookOpenIcon />,
      items: [
        { title: "Introduction", url: "/documentation#introduction" },
        { title: "Get Started", url: "/documentation#get-started" },
      ],
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string | null
  }
  onSignOut?: () => void
  LinkComponent?: React.ElementType
}

export function AppSidebar({
  user,
  onSignOut,
  LinkComponent,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBrand brand={data.brand} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} LinkComponent={LinkComponent} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} onSignOut={onSignOut} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
