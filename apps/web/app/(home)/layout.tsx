// app/(home)/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"
import { AppSidebarWrapper } from "../../components/sidebarWrapper"
import { HorizontalNavbarWrapper } from "../../components/horizontalNavbarWrapper"

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/auth")
  }

  return (
    <SidebarProvider>
      <AppSidebarWrapper />
      <SidebarInset>
        <HorizontalNavbarWrapper />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}