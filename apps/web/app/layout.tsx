import ReactqueryProvider from "@/lib/providers/ReactqueryProvider"
import { Geist_Mono, EB_Garamond, Space_Grotesk, Fraunces, DM_Sans } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { THEME_NAMES } from "@/store/slices/themeSlice"

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-eb-garamond" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })

const THEME_INIT_SCRIPT = `
  try {
    var saved = localStorage.getItem('theme-name');
    var valid = ${JSON.stringify(THEME_NAMES)};
    if (saved && valid.indexOf(saved) !== -1) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        bodyFont.variable,
        ebGaramond.variable,
        spaceGrotesk.variable,
        fraunces.variable,
        "font-sans"
      )}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

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