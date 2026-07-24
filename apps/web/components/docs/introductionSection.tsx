// web/components/docs/introductionSection.tsx
"use client"

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
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"

const features = [
  {
    icon: <ZapIcon className="h-5 w-5" />,
    title: "Real-time analytics",
    description:
      "Watch visitors, page views, and events land the moment they happen, powered by a Kafka + WebSocket pipeline.",
  },
  {
    icon: <GlobeIcon className="h-5 w-5" />,
    title: "Multi-domain support",
    description:
      "Track as many domains as you like from one account, each with its own scoped API key and script.",
  },
  {
    icon: <GaugeIcon className="h-5 w-5" />,
    title: "Timezone-aware reporting",
    description:
      "Every chart respects each domain's local timezone, so 'today' always means today for your visitors.",
  },
  {
    icon: <BellIcon className="h-5 w-5" />,
    title: "Spike detection & alerts",
    description:
      "An adaptive baseline watches your traffic and notifies you the moment something unusual happens.",
  },
  {
    icon: <ShieldCheckIcon className="h-5 w-5" />,
    title: "Privacy-conscious by design",
    description:
      "Visitor identity is derived from a server-side hash, never raw IPs stored client-side.",
  },
  {
    icon: <ActivityIcon className="h-5 w-5" />,
    title: "Lightweight collector",
    description:
      "A tiny async script that won't slow down your site, no cookies required for basic tracking.",
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
        <p className="max-w-2xl font-heading text-muted-foreground">
          Webanly is a web analytics platform that gives you a real-time, privacy-conscious
          view of how people use your site. Add a domain, drop in one script, and get a live
          dashboard of visitors, page views, dwell time, exit pages, and traffic spikes.
        </p>
         <Alert>
            <ShieldCheckIcon className="h-4 w-4" />
            <AlertTitle>Not for professional use</AlertTitle>
            <AlertDescription>
                this app do not varifies domain names through dns or any varification. treating domain names as just a user name.
            </AlertDescription>
        </Alert>
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