// web/app/page.tsx
"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import { LoginForm } from "@workspace/ui/components/main/login-form"
import { Activity, Globe, Bell, LineChart } from "lucide-react"

export default function LandingPage() {
  

  async function handleGithubLogin() {
    await authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" })
  }

  return (
    <main className="min-h-screen min-w-full">
      <nav className="border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
           
              <CardTitle className="text-xl">Webanly</CardTitle>
      
            <Separator orientation="vertical" className="h-6" />
              <CardDescription className="text-sm text-muted-foreground">
                 traffic analytics platform
              </CardDescription>
            
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="#features">Features</a>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">Sign in</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogTitle>Sign in</DialogTitle>
                <LoginForm onGithubLogin={handleGithubLogin} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <CardTitle className="text-4xl font-semibold tracking-tight sm:text-5xl">

                Understand your website traffic with clarity and confidence.
                </CardTitle>
              
              <CardDescription className="text-lg font-semibold text-muted-foreground">
                Webanly gives you a live view of visitors, traffic sources, and activity on your site — accurate to the second. Track conversions, spot trends, and act before your next surge.
                
                  <CardTitle>
                   -: not for profesional use :-
                  </CardTitle>
                  <CardDescription>
                  -: this is just a project not product. it do not have domain varification yet :- 
                  </CardDescription>
                
              </CardDescription>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg">Get started</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogTitle>Sign in</DialogTitle>
                  <LoginForm onGithubLogin={handleGithubLogin} />
                </DialogContent>
              </Dialog>
              
            </div>
            

            
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4 rounded-3xl px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]">Live · webanly.com</p>
                  <p className="mt-2 text-sm font-semibold">Realtime visitor stream</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em]">
                  Active
                </Badge>
              </div>
              <div className="mt-6 rounded-[1.5rem] p-5">
                <svg viewBox="0 0 400 120" className="h-40 w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points="0,90 45,70 90,75 135,40 180,55 225,30 270,50 315,35 360,55 400,25"
                  />
                </svg>
              </div>
              <div className="grid gap-4 font-heading sm:grid-cols-3 pt-4 text-sm">
                <div>
                  <p className="text-xl font-semibold">8.2K</p>
                  <p>Visitors today</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">15K</p>
                  <p>Total views</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">35s</p>
                  <p>Avg time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <CardDescription className="text-sm uppercase tracking-[0.32em]">Fast, reliable visibility</CardDescription>
          <CardTitle className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to read your traffic.
          </CardTitle>
          <p className="mt-4 max-w-xl text-lg leading-8">
            Webanly brings clarity to every visitor session, campaign source, and traffic spike so your team can make decisions with confidence.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <Activity className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Traffic analytics</CardTitle>
              <CardDescription>
                Monitor traffic patterns and discover which pages are driving engagement.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Source insights</CardTitle>
              <CardDescription>
                See exactly where traffic is coming from, including referrers and campaigns.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Bell className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Spike alerts</CardTitle>
              <CardDescription>
                Get notified instantly when traffic moves outside of your normal range.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LineChart className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Historical trends</CardTitle>
              <CardDescription>
                Compare performance day-over-day, week-over-week, and quarter-over-quarter.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Activity className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Live visitor count</CardTitle>
              <CardDescription>
                Watch concurrent visitor numbers rise and fall in real time.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Performance pulse</CardTitle>
              <CardDescription>
                Keep your dashboard in sync with the most important traffic indicators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

    </main>
  )
}