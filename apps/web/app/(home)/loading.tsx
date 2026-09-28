export default function HomeLoading() {
  return (
    <div
      className="grid gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading page content</span>
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-72 animate-pulse rounded-lg border bg-card" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
    </div>
  )
}
