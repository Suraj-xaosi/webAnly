interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = "html" }: CodeBlockProps) {
  return (
    <div className="relative rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}