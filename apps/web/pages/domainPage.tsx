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

          <CardHeader className="px-0">
            <CardTitle className="text-lg">Domains & scripts</CardTitle>
            <CardDescription>
              Your tracking snippets, one per domain.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <DomainScriptsSection />
          </CardContent>

      </section>

      <section id="apikey" className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8">

   
            <CardTitle className="text-lg">Domain API keys</CardTitle>
            <CardDescription>
              Reveal, copy, or revoke access for each domain.
            </CardDescription>

          <CardContent className="px-0">
            <DomainApiKeySection />
          </CardContent>
        
      </section>

      <section id="add" className="flex min-h-screen w-full snap-start flex-col gap-4 px-6 py-8">

            <AddDomainForm />
      </section>
    </div>
  )
}