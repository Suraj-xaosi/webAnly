import { Popover, PopoverContent, PopoverTrigger } from "../popover.js"
import { Button } from "../button.js"

export function BasicPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm text-muted-foreground">
          Your content here.
        </p>
      </PopoverContent>
    </Popover>
  )
}