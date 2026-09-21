import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
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
        <h2 className="text-2xl font-semibold tracking-tight">Add your website</h2>
        <p className="max-w-2xl text-muted-foreground">
          Open the domain page, add your website, and copy the script shown there. Paste it
          inside your site&apos;s <code className="mx-1 font-mono text-xs">&lt;head&gt;</code> tag.
        </p>
      </div>

      <CodeBlock code={snippet} language="html" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="font-mono text-xs text-primary">data-domain-name</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This tells Webanly which website the visit belongs to. Use the website address
              you added in the domain page.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="font-mono text-xs text-primary">data-api-key</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This connects your website to your Webanly account. Keep the full script in your
              site&apos;s head section.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold tracking-tight">
          Optional: group similar page addresses
        </h3>
        <p className="max-w-2xl text-muted-foreground">
          You can add <code className="font-mono text-xs">data-normalize-pattern</code> later
          if your site creates many URLs for similar pages. Most websites can skip this.
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
      </div>
    </div>
  )
}