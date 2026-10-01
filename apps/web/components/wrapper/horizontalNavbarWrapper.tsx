"use client"

import { useRouter } from "next/navigation"
import { HorizontalNavbar } from "@workspace/ui/components/main/horizontalNavbar"
import { ThemeSwitcher } from "@/components/theme/theme-switcher"
import NotificationBell from "@/components/notify/notificationBell"

interface HorizontalNavbarWrapperProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function HorizontalNavbarWrapper({
  user,
}: HorizontalNavbarWrapperProps) {
  const router = useRouter()

  return (
    <HorizontalNavbar
      themeSwitcher={<ThemeSwitcher />}
      notificationBell={<NotificationBell />}
      user={user}
      onNavigate={(href) => router.push(href)}
    />
  )
}
