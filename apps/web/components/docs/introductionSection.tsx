import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  ActivityIcon,
  BellIcon,
  GaugeIcon,
  GlobeIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react"

const features = [
  {
    icon: <ZapIcon className="h-5 w-5" />,
    title: "See visitors and views",
    description:
      "See how many people visit your website and how many pages they view.",
  },
  {
    icon: <GlobeIcon className="h-5 w-5" />,
    title: "Track more than one website",
    description:
      "Keep each website separate while managing them from the same account.",
  },
  {
    icon: <GaugeIcon className="h-5 w-5" />,
    title: "Use your own timezone",
    description:
      "Choose a timezone so dates and daily reports match the place you work from.",
  },
  {
    icon: <BellIcon className="h-5 w-5" />,
    title: "Understand page journeys",
    description:
      "See where visitors came from, which page they opened, and where they went next.",
  },
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    title: "Ask the traffic assistant",
    description:
      "Ask plain-language questions about your traffic and get an answer from your analytics data.",
  },
  {
    icon: <ActivityIcon className="h-5 w-5" />,
    title: "Keep setup simple",
    description:
      "Add one small script to your website, then use the dashboard to explore the results.",
  },
]

export function IntroductionSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          Welcome
        </Badge>
        <h2 className="text-2xl font-heading font-semibold tracking-tight">What is Webanly?</h2>
        <p className="max-w-2xl text-muted-foreground">
          Webanly is a simple dashboard for understanding your website traffic. It helps you
          see visitors, page views, popular pages, traffic sources, and page journeys without
          making you dig through complicated reports.
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Start by adding your website and placing the tracking script in its head section.
          After that, open the dashboard whenever you want to understand what your visitors are doing.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                {feature.icon}
              </div>
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}