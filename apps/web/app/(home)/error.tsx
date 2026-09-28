"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center p-6" role="alert">
      <Card className="w-full max-w-lg border-destructive/40">
        <CardHeader>
          <CardTitle>We couldn&apos;t load this page</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected page error occurred."}
          </p>
          <Button className="w-fit" onClick={reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
