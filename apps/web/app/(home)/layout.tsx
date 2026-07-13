// app/(home)/layout.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"
import { AppSidebarWrapper } from "../../components/sidebarWrapper"
import { HorizontalNavbar } from "@workspace/ui/components/main/horizontalNavbar"
import { ThemeSwitcher } from "@/components/theme-switcher"

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
        <HorizontalNavbar themeSwitcher={<ThemeSwitcher />} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}