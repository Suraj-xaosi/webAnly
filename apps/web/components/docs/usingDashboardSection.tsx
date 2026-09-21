import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { BotIcon, CalendarDaysIcon, MousePointerClickIcon } from "lucide-react"

const steps = [
  {
    icon: <CalendarDaysIcon className="h-5 w-5" />,
    title: "Choose a date range",
    description: "Start with today, the last 28 days, or choose your own dates. You can also change the timezone.",
  },
  {
    icon: <MousePointerClickIcon className="h-5 w-5" />,
    title: "Explore the charts",
    description: "Use the cards to compare visitors, views, pages, browsers, devices, countries, and referrers.",
  },
  {
    icon: <BotIcon className="h-5 w-5" />,
    title: "Ask the assistant",
    description: "Open Traffic Assistant and ask a direct question, such as “Which pages were most popular this month?”",
  },
]

export function UsingDashboardSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">Using the dashboard</Badge>
        <h2 className="text-2xl font-semibold tracking-tight">Three simple ways to get answers</h2>
        <p className="max-w-2xl text-muted-foreground">
          You do not need to understand analytics terminology to use Webanly. Pick a date,
          look at the chart that answers your question, or ask the assistant to help.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader className="gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                {step.icon}
              </div>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {step.description}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">
        The assistant can explain the data shown for the selected website. It is best for
        questions about visits, views, popular pages, traffic sources, and changes over time.
      </p>
    </div>
  )
}