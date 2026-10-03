import { redirect } from "next/navigation"
import { auth } from "@/lib/betterAuth/auth"
import { headers } from "next/headers"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"
import ReactqueryProvider from "@/lib/providers/ReactqueryProvider"
import { AppSidebarWrapper } from "../../components/wrapper/sidebarWrapper"
import { HorizontalNavbarWrapper } from "../../components/wrapper/horizontalNavbarWrapper"

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth")
  }

  return (
    <ReactqueryProvider>
      <SidebarProvider>
        <AppSidebarWrapper
          user={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
        <SidebarInset>
          <HorizontalNavbarWrapper
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image ?? "",
            }}
          />
          <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ReactqueryProvider>
  )
}
