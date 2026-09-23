"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/betterAuth/auth-client"
import { AppSidebar as AppSidebarBase } from "@workspace/ui/components/main/app-sidebar"

type SidebarUser = {
  name: string
  email: string
  image?: string | null
}

type AppSidebarWrapperProps = Omit<React.ComponentProps<typeof AppSidebarBase>, "user" | "onSignOut" | "LinkComponent"> & { user: SidebarUser }

export function AppSidebarWrapper({ user, ...props }: AppSidebarWrapperProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/auth")
  }

  return (
    <AppSidebarBase
      {...props}
      user={{ name: user.name, email: user.email, avatar: user.image as string }}
      onSignOut={handleSignOut}
      LinkComponent={Link}
    />
  )
}