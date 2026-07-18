"use client"

import { useRouter } from "next/navigation"
import { HorizontalNavbar } from "@workspace/ui/components/main/horizontalNavbar"
import { ThemeSwitcher } from "@/components/theme-switcher"
import NotificationBell from "@/components/notify/notificationBell"
import { authClient } from "@/lib/auth-client"

export function HorizontalNavbarWrapper() {
    const { data: session } = authClient.useSession()
    const user = {
        name: session?.user.name,
        email: session?.user.email,
        avatar: session?.user.image,
    }
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