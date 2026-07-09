"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { AppSidebar as AppSidebarBase } from "@workspace/ui/components/main/app-sidebar"
import { useEffect, useState } from "react"

export function AppSidebarWrapper(props: React.ComponentProps<typeof AppSidebarBase>) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/auth")
  }

  // Always render the same structure on server + first client paint
  if (!mounted || isPending || !session?.user) {
    return null
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
  }

  return <AppSidebarBase {...props} user={user} onSignOut={handleSignOut} />
}