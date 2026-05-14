import { BaseLogEvent } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9100"
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9106"

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("sx_token") : ""
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API Error ${res.status}: ${err}`)
  }
  return res.json()
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; user: object }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
}

// ---- Alerts ----
export const alertsApi = {
  list: (filters?: Record<string, string>) =>
    apiRequest<{ alerts: any[] }>(`/alerts?${new URLSearchParams(filters)}`),
  get: (id: string) => apiRequest<any>(`/alerts/${id}`),
  update: (id: string, data: object) =>
    apiRequest<any>(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ---- Search ----
export const searchApi = {
  search: (query: string, timeRange?: { start: string; end: string }) =>
    apiRequest<{ results: any[]; total: number; latency_ms: number }>("/search/logs", {
      method: "POST",
      body: JSON.stringify({ query, ...timeRange }),
    }),
  aggregate: (query: string) =>
    apiRequest<{ buckets: any[] }>("/search/aggregate", {
      method: "POST",
      body: JSON.stringify({ query }),
    }),
}

// ---- AI ----
export const aiApi = {
  summarizeAlert: (alertId: string, alertTitle: string, severity: string, sourceEvents: any[]) =>
    apiRequest<{ request_id: string; status: string }>("/ai/alert-summary", {
      method: "POST",
      body: JSON.stringify({ alert_id: alertId, alert_title: alertTitle, alert_severity: severity, source_events: sourceEvents }),
    }),
  nlSearch: (query: string, tenantId: string) =>
    apiRequest<{ request_id: string }>("/ai/search", {
      method: "POST",
      body: JSON.stringify({ query, tenant_id: tenantId }),
    }),
  getResult: (requestId: string) =>
    apiRequest<{ status: string; result?: string }>(`/ai/result/${requestId}`),
}

// ---- Incidents ----
export const incidentsApi = {
  list: () => apiRequest<any[]>("/incidents"),
  get: (id: string) => apiRequest<any>(`/incidents/${id}`),
  create: (data: object) =>
    apiRequest<any>("/incidents", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: object) =>
    apiRequest<any>(`/incidents/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
}

// ---- Threat Intel ----
export const threatIntelApi = {
  checkIp: (ip: string) => apiRequest<any>(`/threat-intel/lookup/ip/${ip}`),
  syncFeed: (feedUrl: string) =>
    apiRequest<any>("/threat-intel/sync", { method: "POST", body: JSON.stringify({ url: feedUrl }) }),
}

// ---- WebSocket ----
export function createSentinelXWebSocket(onMessage: (data: any) => void): WebSocket {
  const token = typeof window !== "undefined" ? localStorage.getItem("sx_token") : ""
  const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`)
  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data))
    } catch { /* ignore */ }
  }
  ws.onerror = (err) => console.error("SentinelX WebSocket error:", err)
  return ws
}
