import { IntroductionSection } from "@/components/docs/introductionSection"
import { GetStartedSection } from "@/components/docs/getStartedSection"
import { UsingDashboardSection } from "@/components/docs/usingDashboardSection"

export default function DocumentationPage() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto snap-y snap-mandatory">
      <section
        id="introduction"
        className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8"
      >
        <IntroductionSection />
      </section>

      <section
        id="get-started"
        className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8"
      >
        <GetStartedSection />
      </section>

      <section
        id="using-dashboard"
        className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8"
      >
        <UsingDashboardSection />
      </section>
    </div>
  )
}