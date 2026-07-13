"use client"

import { useRouter } from "next/navigation"
import { HorizontalNavbar } from "@workspace/ui/components/main/horizontalNavbar"
import { ThemeSwitcher } from "@/components/theme-switcher"

export function HorizontalNavbarWrapper() {
  const router = useRouter()

  return (
    <HorizontalNavbar
      themeSwitcher={<ThemeSwitcher />}
      onNavigate={(href) => router.push(href)}
    />
  )
}