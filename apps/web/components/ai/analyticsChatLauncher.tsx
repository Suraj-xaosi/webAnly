"use client"

import { useState } from "react"
import { SparklesIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverTrigger, PopoverContent } from "@workspace/ui/components/popover"
import { useAppSelector } from "@/store/hooks"
import { selectDomainId } from "@/store/slices/dashboardSlice"
import { AnalyticsChatWidget } from "./analyticsChatWidget"

export function AnalyticsChatLauncher() {
  const domainId = useAppSelector(selectDomainId)
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={!domainId}
          aria-label="Open AI traffic assistant"
        >
          <SparklesIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[380px] max-w-[92vw] overflow-hidden p-0 bg-popover/80 shadow-2xl backdrop-blur-xl"
      >
        {domainId && <AnalyticsChatWidget key={domainId} domainId={domainId} />}
      </PopoverContent>
    </Popover>
  )
}