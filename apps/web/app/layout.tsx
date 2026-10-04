import {
  Cinzel,
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Geist_Mono,
  Space_Grotesk,
} from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { THEME_NAMES } from "@/store/slices/themeSlice"

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
})
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        cormorantGaramond.variable,
        cinzel.variable,
        dmSans.variable,
        spaceGrotesk.variable,
        fraunces.variable,
        "font-sans"
      )}
    >
      <body>
        <script
          src="https://webanly-dashboard.vercel.app/script.js"
          data-collect-api-url="https://webanly.onrender.com/collect"
          data-domain-name="webanly-dashboard.vercel.app715"
          data-api-key="41d3fcc4-19ab-4ea6-8435-b3161bd87cb3"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
