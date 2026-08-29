"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { ThemeNameSync } from "./theme-name-sync"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      <ThemeNameSync />
      {children}
    </NextThemesProvider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  // Latest resolvedTheme ko ref mein rakho — is line ka koi "effect"
  // trigger nahi hota, ye sirf ek plain value-assignment hai jo
  // HAR render pe chalti hai (component-function ke body mein hi)
  const resolvedThemeRef = React.useRef(resolvedTheme)
  resolvedThemeRef.current = resolvedTheme

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return

      // Ref se latest value padho — closure ke andar wali purani
      // value nahi, kyunki ye function sirf EK BAAR banta hai
      setTheme(resolvedThemeRef.current === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [setTheme])   // resolvedTheme dependency array se HATA diya — ab sirf mount pe ek baar chalega
  // (setTheme ko rakha hai kyunki next-themes se aata hai — practically stable hai, lekin
  //  correctness ke liye include karna best-practice hai; exhaustive-deps lint isay chahega)

  return null
}

export { ThemeProvider }