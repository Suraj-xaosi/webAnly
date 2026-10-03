import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { IntroductionSection } from "@/components/docs/introductionSection"
import { GetStartedSection } from "@/components/docs/getStartedSection"
import { UsingDashboardSection } from "@/components/docs/usingDashboardSection"

export const dynamic = "force-static"

export default function DocumentationPage() {
  return (
    <main className="min-h-screen w-full">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/documentation" className="font-heading font-semibold">
            Webanly documentation
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col">
        <section
          id="introduction"
          className="flex min-h-screen w-full snap-start flex-col gap-4 px-4 py-8 sm:px-6"
        >
          <IntroductionSection />
        </section>

        <section
          id="get-started"
          className="flex min-h-screen w-full snap-start flex-col gap-4 px-4 py-8 sm:px-6"
        >
          <GetStartedSection />
        </section>

        <section
          id="using-dashboard"
          className="flex min-h-screen w-full snap-start flex-col gap-4 px-4 py-8 sm:px-6"
        >
          <UsingDashboardSection />
        </section>
      </div>
    </main>
  )
}
