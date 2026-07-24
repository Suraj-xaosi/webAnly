// web/components/docs/getStartedSection.tsx
"use client"

import { Card, CardContent } from "@workspace/ui/components/card"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { InfoIcon, ShieldCheckIcon } from "lucide-react"
import { CodeBlock } from "@/components/docs/codeBlock"

const snippet = `<script
  src="https://cdn.webanly.io/script.js"
  data-domain-name="yourdomain.com"
  data-api-key="YOUR_API_KEY">
</script>`

export function GetStartedSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">Get started</Badge>
        <h2 className="text-2xl font-semibold tracking-tight">Embed the script</h2>
        <p className="max-w-2xl text-muted-foreground">
          Copy this from your Domains & scripts page and paste it into your site&apos;s
          <code className="mx-1 font-mono text-xs">&lt;head&gt;</code>.
        </p>
      </div>

      <CodeBlock code={snippet} language="html" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="font-mono text-xs text-primary">data-domain-name</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Must match <code className="font-mono text-xs">window.location.hostname</code>.
              Mismatches log a console warning but don&apos;t block the request, since the
              server does the real check.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="font-mono text-xs text-primary">data-api-key</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Domain-scoped. Revoke and reissue anytime from Domain API keys if it leaks.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          Optional: path normalization
        </h3>
        <p className="max-w-2xl text-muted-foreground">
          Add <code className="font-mono text-xs">data-normalize-pattern</code> to collapse
          dynamic segments like product IDs before an event is sent. Format is{" "}
          <code className="font-mono text-xs">REGEX::REPLACEMENT</code>.
        </p>
        <CodeBlock
          code={`<script
  src="https://cdn.webanly.io/script.js"
  data-domain-name="yourdomain.com"
  data-api-key="YOUR_API_KEY"
  data-normalize-pattern="\\/product\\/[\\w-]+-\\d+::/product/:id">
</script>`}
          language="html"
        />
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>This is a refinement, not a requirement</AlertTitle>
          <AlertDescription>
            Skip it, or get the regex wrong, and events still send fine, the server runs its
            own normalization on top regardless.
          </AlertDescription>
        </Alert>
      </div>

      <Alert>
        <ShieldCheckIcon className="h-4 w-4" />
        <AlertTitle>Safe to expose</AlertTitle>
        <AlertDescription>
          The API key in this snippet is domain-locked and meant to sit in client HTML, it&apos;s
          not a secret credential.
        </AlertDescription>
      </Alert>
    </div>
  )
}