"use client"
import { useEffect, useRef, useCallback, useState } from "react"
import { createSentinelXWebSocket } from "@/lib/api"

export interface RealtimeEvent {
  type: "new_alert" | "live_log" | "incident_update" | "metric_tick" | "connected" | "ping"
  [key: string]: any
}

interface UseRealtimeOptions {
  onAlert?: (data: any) => void
  onLog?: (data: any) => void
  onMetric?: (data: any) => void
  onIncident?: (data: any) => void
}

export function useRealtimeStream(options: UseRealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [reconnectCount, setReconnectCount] = useState(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = createSentinelXWebSocket((data: RealtimeEvent) => {
        switch (data.type) {
          case "new_alert":
            options.onAlert?.(data)
            break
          case "live_log":
            options.onLog?.(data)
            break
          case "metric_tick":
            options.onMetric?.(data)
            break
          case "incident_update":
            options.onIncident?.(data)
            break
        }
      })

      ws.onopen = () => {
        setConnected(true)
        setReconnectCount(0)
      }
      ws.onclose = () => {
        setConnected(false)
        // Exponential backoff reconnect
        const delay = Math.min(1000 * 2 ** reconnectCount, 30000)
        reconnectTimer.current = setTimeout(() => {
          setReconnectCount(c => c + 1)
          connect()
        }, delay)
      }
      ws.onerror = () => ws.close()
      wsRef.current = ws
    } catch (err) {
      console.error("WebSocket connection error:", err)
    }
  }, [options, reconnectCount])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [])

  return { connected, reconnectCount }
}
