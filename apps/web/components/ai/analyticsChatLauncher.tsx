"use client"

import { useState } from "react"
import { SparklesIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogTrigger } from "@workspace/ui/components/dialog"
import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { AnalyticsChatWidget } from "./analyticsChatWidget"

export function AnalyticsChatLauncher() {
  const domainId = useAppSelector(selectDomainId)
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