"use client"

import { createContext, useContext, useRef, useCallback, type ReactNode } from "react"
import { useWebSocket, type WebSocketMessage } from "@/hooks/realtime/useWebSocket"

type MessageListener = (message: WebSocketMessage) => void

interface RealtimeContextValue {
  subscribe: (listener: MessageListener) => () => void
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

interface RealtimeProviderProps {
  domainId: string
  apikey: string
  children: ReactNode
}

export function RealtimeProvider({ domainId, apikey, children }: RealtimeProviderProps) {
  // Sirf "kaun sun raha hai" track karna hai — UI mein kabhi nahi dikhna,
  // isliye useRef. Set isliye kyunki same listener do baar add nahi hona chahiye.
  const listenersRef = useRef<Set<MessageListener>>(new Set())

  // Yahi ab poore dashboard ke liye EK connection hai.
  const { isConnected } = useWebSocket(domainId, apikey, (message) => {
    listenersRef.current.forEach((listener) => listener(message))
  })

  // useCallback isliye taaki `subscribe` ka reference stable rahe har render pe —
  // warna isConnected change hote hi ek naya `subscribe` function ban jaata,
  // aur neeche wale hooks ka useEffect baar-baar re-run hota.
  const subscribe = useCallback((listener: MessageListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) {
    throw new Error("useRealtimeContext must be used inside a RealtimeProvider")
  }
  return ctx
}