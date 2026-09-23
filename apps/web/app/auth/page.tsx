
"use client"

import { authClient } from "@/lib/betterAuth/auth-client"
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
              <CardDescription className="font-sans text-sm text-muted-foreground">
                Simple website analytics
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

                See what is happening on your website.
                </CardTitle>
              
              <CardDescription className="font-sans text-lg font-semibold text-muted-foreground">
                Webanly shows your visitors, popular pages, traffic sources, and page journeys in one clear dashboard. Ask the traffic assistant questions when you want a quick answer.
                
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
                  <p className="text-xs uppercase tracking-[0.24em]">Your website</p>
                  <p className="mt-2 text-sm font-semibold">A simple view of your traffic</p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em]">
                  Live data
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
                  <p>Visitors</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">15K</p>
                  <p>Page views</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">35s</p>
                  <p>Average time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <CardDescription className="text-sm uppercase tracking-[0.32em]">What you can do</CardDescription>
          <CardTitle className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            The important parts of your traffic, in one place.
          </CardTitle>
          <p className="mt-4 max-w-xl text-lg leading-8">
            Open the dashboard, choose a date range, and explore your data. Nothing complicated is required.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <Activity className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Understand visitors</CardTitle>
              <CardDescription>
                See how many people visit your site and how often they return.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Find popular pages</CardTitle>
              <CardDescription>
                Compare pages by views, visitors, and time spent.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Bell className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Follow page journeys</CardTitle>
              <CardDescription>
                See which pages visitors came from and where they went next.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LineChart className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Choose any time range</CardTitle>
              <CardDescription>
                Look at today, last week, this month, or a range you choose.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Activity className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Ask the traffic assistant</CardTitle>
              <CardDescription>
                Ask questions such as “How did traffic change last week?”
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Globe className="mb-2 h-5 w-5" />
              <CardTitle className="text-base">Keep your data in one place</CardTitle>
              <CardDescription>
                Add your website once and return to the same dashboard whenever you need it.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

    </main>
  )
}