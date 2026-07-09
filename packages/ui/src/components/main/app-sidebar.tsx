"use client"

import * as React from "react"

import { NavMain } from "@workspace/ui/components/nav-main"
//import { NavProjects } from "@workspace/ui/components/nav-projects"
import { NavUser } from "@workspace/ui/components/nav-user"
//import { TeamSwitcher } from "@workspace/ui/components/domain-switcher"
import {SidebarBrand} from "@workspace/ui/components/sidebarBrand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"
import { Avatar } from "radix-ui"

// This is sample data.
const data = {
  brand: {
    name: "webanly",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "webAnly",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "pro",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "premium",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "domain",
      url: "/domain",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      items: [
        
        {
          title: "domains & scripts",
          url: "/domain#scripts",
        },
        {
          title: "domain - apikey",
          url: "/domain#apikey",
        },
        {
          title: "add & update domain",
          url: "/domain#add",
        },
      ],
    },
    {
      title: "dashboard",
      url: "/dashboard",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "analytics dashboard",
          url: "/dashboard",
        },
        {
          title: "Live dashboard",
          url: "/liveDashboard",
        },
        {
          title: "Public dashboard",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Rules",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "Account settings",
          url: "#",
        },
        {
          title: "Dashboard settings",
          url: "#",
        },
        {
          title: "Domain settings",
          url: "#",
        },
      
        
      ],
    },
  ],
  projects: [
    /*{
      name: "Design Engineering",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapIcon
        />
      ),
    },*/
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string | null
  }
  onSignOut?: () => void
}

export function AppSidebar({ user, onSignOut, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        
        <SidebarBrand brand={data.brand}/>
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} onSignOut={onSignOut} />}
      </SidebarFooter>
      <SidebarRail />
      {/* i need here  <HorizontalNavbar /> */}
    </Sidebar>
  )
}