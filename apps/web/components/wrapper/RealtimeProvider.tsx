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


  const listenersRef = useRef<Set<MessageListener>>(new Set())


  const { isConnected } = useWebSocket(domainId, apikey, (message) => {
    listenersRef.current.forEach((listener) => listener(message))
  })

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