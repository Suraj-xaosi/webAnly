"use client"

import { useState, useSyncExternalStore } from "react"
import { useAddDomain } from "@/hooks/domainCrud/useAddDomain"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { getBrowserTimezone, useTimezoneOptions } from "../picker/timezonePicker"
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
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "").replace(/[/?#].*$/, "")
  return withoutProtocol.toLowerCase().replace(/[^a-z0-9.:-]/g, "")
}

function finalizeDomain(value: string) {
  return value.replace(/:\d*$/, "").replace(/\.$/, "")
}

function sanitizeVisitorInput(value: string) {
  if (value === "") return ""
  return value.replace(/\D/g, "")
}

function isValidDomain(value: string) {
  return DOMAIN_PATTERN.test(value)
}

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

function subscribeToBrowserTimezone() {
  return () => {}
}

function getServerTimezone() {
  return "UTC"
}

export function AddDomainForm() {
  const addDomainMutation = useAddDomain()
  const [domainName, setDomainName] = useState("")
  const [expectedVisitors, setExpectedVisitors] = useState("100")
  const browserTimezone = useSyncExternalStore(
    subscribeToBrowserTimezone,
    getBrowserTimezone,
    getServerTimezone
  )
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)
  const defaultTimezone = selectedTimezone ?? browserTimezone
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const options = useTimezoneOptions()
  const timezoneOptions = [...new Set([...options, defaultTimezone])]
    .filter((option) => option.trim().length > 0)
  const timezoneValue = defaultTimezone.trim() ? defaultTimezone : "UTC"

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const sanitizedDomain = finalizeDomain(sanitizeDomainInput(domainName))
    const sanitizedVisitors = sanitizeVisitorInput(expectedVisitors)
    const visitorCount = Number.parseInt(sanitizedVisitors || "100", 10)

    if (!sanitizedDomain || !isValidDomain(sanitizedDomain)) {
      setError("Enter a valid domain name, such as example.com.")
      return
    }

    if (!Number.isFinite(visitorCount) || visitorCount < 1) {
      setError("Enter the full hostname exactly as it appears in your browser, such as www.example.com.")
      return
    }

    const safeTimezone = isValidTimezone(defaultTimezone)
      ? defaultTimezone
      : getBrowserTimezone()

    addDomainMutation.mutate(
      {
        domainName: sanitizedDomain,
        expectedVisitors: visitorCount,
        defaultTimezone: safeTimezone,
      },
      {
        onSuccess: () => {
          setSuccess(true)
          setDomainName("")
          setExpectedVisitors("100")
          setSelectedTimezone(safeTimezone)
        },
        onError: (mutationError) => {
          setError(mutationError.message)
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlusIcon className="size-4" />
          Add a domain
        </CardTitle>
        <CardDescription>
          Enter your site's full hostname exactly as it appears in your browser's address bar, for example www.example.com or app.example.com. www.example.com and example.com are treated as different sites, so if your site opens on both, redirect one to the other. Each domain gets its own tracking script and API key. The API key is not secret, it is just a token.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domainName">Domain name</Label>
            <Input
              id="domainName"
              placeholder="www.example.com"
              value={domainName}
              onChange={(e) => setDomainName(sanitizeDomainInput(e.target.value))}
              disabled={addDomainMutation.isPending}
              required
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div> 

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedVisitors">Expected visitors in 5min</Label>
            <p className="text-xs text-muted-foreground">
              Used as the baseline for spike alerts — set this close to your real traffic.
            </p>
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
              disabled={addDomainMutation.isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultTimezone">Default timezone</Label>
            <div className="flex items-center gap-2">
              <Select value={timezoneValue} onValueChange={setSelectedTimezone}>
                <SelectTrigger className="w-[220px]">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {timezoneOptions.map((option) => (
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

          <Button type="submit" disabled={addDomainMutation.isPending} className="w-fit gap-2">
            {addDomainMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            {addDomainMutation.isPending ? "Adding..." : "Add domain"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}