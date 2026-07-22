// web/components/domains/AddDomainForm.tsx
"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { setDomain } from "@/lib/Actions/setDomain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { getBrowserTimezone, getTimezoneOptions } from "../timezonePicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Clock3, Loader2Icon, PlusIcon } from "lucide-react"

const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

function sanitizeDomainInput(value: string) {
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
  return withoutProtocol.toLowerCase().replace(/[^a-z0-9.-]/g, "")
}

function sanitizeVisitorInput(value: string) {
  if (value === "") return ""
  return value.replace(/\D/g, "")
}

function isValidDomain(value: string) {
  return DOMAIN_PATTERN.test(value)
}

export function AddDomainForm() {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [domainName, setDomainName] = useState("")
  const [expectedVisitors, setExpectedVisitors] = useState("100")
  const [defaultTimezone, setDefaultTimezone] = useState("UTC")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const options = useMemo(() => getTimezoneOptions(), [])

  useEffect(() => {
    const browserTimezone = getBrowserTimezone()
    if (!defaultTimezone || defaultTimezone === "UTC" || !options.includes(defaultTimezone)) {
      setDefaultTimezone(browserTimezone)
    }
  }, [defaultTimezone, options])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const sanitizedDomain = sanitizeDomainInput(domainName)
    const sanitizedVisitors = sanitizeVisitorInput(expectedVisitors)
    const visitorCount = Number.parseInt(sanitizedVisitors || "100", 10)

    if (!sanitizedDomain || !isValidDomain(sanitizedDomain)) {
      setError("Enter a valid domain name, such as example.com.")
      return
    }

    if (!Number.isFinite(visitorCount) || visitorCount < 1) {
      setError("Expected visitors must be at least 1.")
      return
    }

    const safeTimezone = options.includes(defaultTimezone) ? defaultTimezone : "UTC"

    startTransition(async () => {
      const result = await setDomain(sanitizedDomain, visitorCount, safeTimezone)

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      setDomainName("")
      setExpectedVisitors("100")
      setDefaultTimezone(safeTimezone)
      await queryClient.invalidateQueries({ queryKey: ["domain"] })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusIcon className="size-4" />
          Add a domain
        </CardTitle>
        <CardDescription>
          You can track up to 2 domains. Each gets its own tracking script and API key.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainName">Domain name</Label>
            <Input
              id="domainName"
              placeholder="example.com"
              value={domainName}
              onChange={(e) => setDomainName(sanitizeDomainInput(e.target.value))}
              disabled={isPending}
              required
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedVisitors">Expected daily visitors</Label>
            <Input
              id="expectedVisitors"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000000}
              step={1}
              placeholder="100"
              value={expectedVisitors}
              onChange={(e) => setExpectedVisitors(sanitizeVisitorInput(e.target.value))}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", "."].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultTimezone">Default timezone</Label>
            <div className="flex items-center gap-2">
              <Select value={defaultTimezone} onValueChange={(value) => setDefaultTimezone(value)}>
                <SelectTrigger className="w-[220px]">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
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