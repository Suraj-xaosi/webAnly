"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { SparklesIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogTrigger } from "@workspace/ui/components/dialog"
import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection"

const AnalyticsChatWidget = dynamic(
  () => import("./analyticsChatWidget").then((module) => module.AnalyticsChatWidget),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading assistant...
      </div>
    ),
  }
)

export function AnalyticsChatLauncher() {
  const { activeDomainId: domainId } = useDomainSelection()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={!domainId}
          aria-label="Open AI traffic assistant"
        >
          <SparklesIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="h-[min(86vh,760px)] w-[min(92vw,980px)] max-w-none overflow-hidden border-0 bg-transparent p-0 shadow-none ring-0"
      >
        {domainId && <AnalyticsChatWidget key={domainId} domainId={domainId} />}
      </DialogContent>
    </Dialog>
  )
}