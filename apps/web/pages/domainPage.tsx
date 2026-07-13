// web/pages/domainPage.tsx
"use client"

import { AddDomainForm } from "@/components/domain/addDomainForm"
import { DomainApiKeySection } from "@/components/domain/domainApikeySection"
import { DomainScriptsSection } from "@/components/domain/domainScriptsSection"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function DomainPage() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-y-auto snap-y snap-mandatory">
      <section id="scripts" className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8">
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-lg">Domains & scripts</CardTitle>
            <CardDescription>
              Your tracking snippets, one per domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <DomainScriptsSection />
          </CardContent>
        </Card>
      </section>

      <section id="apikey" className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8">
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-lg">Domain API keys</CardTitle>
            <CardDescription>
              Reveal, copy, or revoke access for each domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <DomainApiKeySection />
          </CardContent>
        </Card>
      </section>

      <section id="add" className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8">
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-lg">Add & update domain</CardTitle>
            <CardDescription>
              Register a new domain to start tracking it.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <AddDomainForm />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}