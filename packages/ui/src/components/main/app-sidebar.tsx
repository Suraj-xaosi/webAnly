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
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

// This is sample data.
const data = {
  brand: {
    name: "webanly",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "webAnly",
      logo: <GalleryVerticalEndIcon />,
      plan: "pro",
    },
    {
      name: "Acme Corp.",
      logo: <AudioLinesIcon />,
      plan: "premium",
    },
    {
      name: "Evil Corp.",
      logo: <TerminalIcon />,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "domain",
      url: "/domain",
      icon: <TerminalSquareIcon />,
      isActive: true,
      items: [
        { title: "domains & scripts", url: "/domain#scripts" },
        { title: "domain - apikey", url: "/domain#apikey" },
        { title: "add & update domain", url: "/domain#add" },
      ],
    },
    {
      title: "dashboard",
      url: "/dashboard",
      icon: <BotIcon />,
      items: [
        { title: "analytics dashboard", url: "/dashboard" },
        { title: "Live dashboard", url: "/liveDashboard" },
        
      ],
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: <BookOpenIcon />,
      items: [
        { title: "Introduction", url: "/documentation#introduction" },
        { title: "Get Started", url: "/documentation#get-started" },
        { title: "Tutorials", url: "#" },
        { title: "Rules", url: "#" },
      ],
},
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        { title: "Account settings", url: "#" },
        { title: "Dashboard settings", url: "#" },
        { title: "Domain settings", url: "#" },
      ],
    },
  ],
  projects: [],
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

export function AppSidebar({ user, onSignOut, LinkComponent, ...props }: AppSidebarProps) {
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