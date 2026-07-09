// web/pages/domainPage.tsx
"use client"

import { AddDomainForm } from "@/components/domain/addDomainForm"
import {DomainApiKeySection} from "@/components/domain/domainApikeySection"
import {DomainScriptsSection} from "@/components/domain/domainScriptsSection"

export default function DomainPage() {
  return (
    <div className="flex flex-col w-full min-h-screen snap-y snap-mandatory overflow-y-auto">
      <section id="scripts" className="flex flex-col gap-4 w-full min-h-screen snap-start px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold">Domains & scripts</h2>
          <p className="text-sm text-muted-foreground">
            Your tracking snippets, one per domain.
          </p>
        </div>
        <DomainScriptsSection />
      </section>
 
      <section id="apikey" className="flex flex-col gap-4 w-full min-h-screen snap-start px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold">Domain API keys</h2>
          <p className="text-sm text-muted-foreground">
            Reveal, copy, or revoke access for each domain.
          </p>
        </div>
        <DomainApiKeySection />
      </section>
 
      <section id="add" className="flex flex-col gap-4 w-full min-h-screen snap-start px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold">Add & update domain</h2>
          <p className="text-sm text-muted-foreground">
            Register a new domain to start tracking it.
          </p>
        </div>
        <AddDomainForm />
      </section>
    </div>
  )
}