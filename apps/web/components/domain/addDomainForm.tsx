// web/components/domains/AddDomainForm.tsx
"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { setDomain } from "@/lib/Actions/setDomain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { PlusIcon, Loader2Icon } from "lucide-react"

export function AddDomainForm() {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [domainName, setDomainName] = useState("")
  const [expectedVisitors, setExpectedVisitors] = useState("100")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await setDomain(domainName, Number(expectedVisitors))

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setDomainName("")
      setExpectedVisitors("100")
      // Refresh the domains list everywhere it's used (sidebar switcher, scripts list, apikey list)
      queryClient.invalidateQueries({ queryKey: ["domain"] })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2  text-base">
          <PlusIcon className="size-4" />
          Add a domain
        </CardTitle>
        <CardDescription>
          You can track up to 2 domains. Each gets its own tracking script and API key.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainName">Domain name</Label>
            <Input
              id="domainName"
              placeholder="example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedVisitors">Expected daily visitors</Label>
            <Input
              id="expectedVisitors"
              type="number"
              min={1}
              placeholder="100"
              value={expectedVisitors}
              onChange={(e) => setExpectedVisitors(e.target.value)}
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-500">
              Domain added successfully.
            </p>
          )}

          <Button type="submit" disabled={isPending} className="w-fit gap-2">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isPending ? "Adding..." : "Add domain"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}