import { Skeleton } from "@workspace/ui/components/skeleton"

export default function HomeLoading() {
  return (
    <div
      className="grid gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading page content</span>
      <div className="grid gap-4 rounded-xl border bg-card p-5">
        <Skeleton className="h-6 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
