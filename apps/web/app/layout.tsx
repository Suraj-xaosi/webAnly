// web/app/layout.tsx
import ReactqueryProvider from "@/lib/providers/ReactqueryProvider"
import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", fontMono.variable, geist.variable, "font-sans")}>
      
      <body>
        <script
          src="http://localhost:3000/script.js"
          data-domain-name="localhost"
          data-api-key="4f0d41e0-2270-4f70-9c51-a4d217a63011">
        </script>
        <ReactqueryProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </ReactqueryProvider>
      </body>
    </html>
  )
}