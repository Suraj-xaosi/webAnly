// web/app/layout.tsx
import ReactqueryProvider from "@/lib/providers/ReactqueryProvider"
import { Geist, Geist_Mono, Cinzel, Space_Grotesk, Fraunces } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

// Per-theme heading fonts — all loaded upfront, selected at runtime via
// --font-heading in globals.css based on the active [data-theme="..."].
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        geist.variable,
        cinzel.variable,
        spaceGrotesk.variable,
        fraunces.variable,
        "font-sans"
      )}
    >

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