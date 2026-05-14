"use client"
import { useState, useEffect } from "react"
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, Filter, RefreshCw, Bell } from "lucide-react"

interface Alert {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  status: "open" | "in_progress" | "resolved"
  source: string
  mitre_tactics: string[]
  created_at: string
  assignee?: string
}

const MOCK_ALERTS: Alert[] = [
  { id: "1", title: "Multiple Failed Logins from Russia", severity: "critical", status: "open", source: "192.168.1.45", mitre_tactics: ["Credential Access", "Brute Force"], created_at: "2026-05-14T10:00:00Z" },
  { id: "2", title: "Suspicious PowerShell Execution", severity: "high", status: "in_progress", source: "WIN-SRV-02", mitre_tactics: ["Execution", "Defense Evasion"], created_at: "2026-05-14T09:50:00Z", assignee: "Alice" },
  { id: "3", title: "Impossible Travel Detected", severity: "high", status: "open", source: "alice@acme.com", mitre_tactics: ["Initial Access"], created_at: "2026-05-14T09:40:00Z" },
  { id: "4", title: "Unusual Outbound Traffic Volume", severity: "medium", status: "open", source: "10.0.0.5", mitre_tactics: ["Exfiltration"], created_at: "2026-05-14T09:30:00Z" },
  { id: "5", title: "AWS Root Account Login", severity: "critical", status: "open", source: "CloudTrail", mitre_tactics: ["Privilege Escalation"], created_at: "2026-05-14T09:20:00Z" },
  { id: "6", title: "Ransomware File Extension Pattern", severity: "critical", status: "open", source: "FILE-SRV-01", mitre_tactics: ["Impact", "Inhibit System Recovery"], created_at: "2026-05-14T09:10:00Z" },
]

const SEV_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-500" },
  high:     { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", dot: "bg-orange-500" },
  medium:   { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", dot: "bg-yellow-500" },
  low:      { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", dot: "bg-blue-500" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [filter, setFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Alert | null>(null)

  const filtered = filter === "all" ? alerts : alerts.filter(a =>
    filter === "open" ? a.status === "open" :
    filter === "critical" ? a.severity === "critical" : true
  )

  return (
    <div className="flex h-full bg-[#0A0B0E] text-white">
      {/* Alert List */}
      <div className="w-2/5 border-r border-[#1E293B] flex flex-col">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-cyan-400" />
            <h2 className="font-semibold text-sm">Alert Queue</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-mono">
              {alerts.filter(a => a.status === "open").length}
            </span>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-[#1E293B] text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 flex gap-2 border-b border-[#1E293B]">
          {["all", "open", "critical"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-slate-500 hover:text-white"
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Alert Items */}
        <div className="flex-1 overflow-auto">
          {filtered.map(alert => {
            const s = SEV_CONFIG[alert.severity]
            return (
              <div key={alert.id}
                onClick={() => setSelected(alert)}
                className={`p-4 border-b border-[#1E293B] cursor-pointer transition-all hover:bg-[#12141A] ${selected?.id === alert.id ? "bg-[#12141A] border-l-2 border-l-cyan-500" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${s.bg} ${s.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-600 font-mono">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-white mb-1">{alert.title}</p>
                <p className="text-xs text-slate-500 font-mono">{alert.source}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {alert.mitre_tactics.slice(0, 2).map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] rounded border border-violet-500/20">{t}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert Detail */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-6 border-b border-[#1E293B]">
              <div className="flex items-start justify-between">
                <div>
                  <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${SEV_CONFIG[selected.severity].bg} ${SEV_CONFIG[selected.severity].color} mb-3`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${SEV_CONFIG[selected.severity].dot}`} />
                    {selected.severity.toUpperCase()} · {selected.status.replace("_", " ").toUpperCase()}
                  </div>
                  <h1 className="text-xl font-bold text-white">{selected.title}</h1>
                  <p className="text-slate-500 text-sm mt-1 font-mono">Source: {selected.source}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors">
                    Assign to Me
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* MITRE Tactics */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MITRE ATT&CK Tactics</h3>
                <div className="flex gap-2 flex-wrap">
                  {selected.mitre_tactics.map(t => (
                    <span key={t} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-sm rounded-lg border border-violet-500/20">{t}</span>
                  ))}
                </div>
              </div>

              {/* AI Summary Placeholder */}
              <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400 text-xs">AI</span>
                  </div>
                  <span className="text-xs font-semibold text-cyan-400">AI Analysis</span>
                </div>
                <p className="text-sm text-slate-300">
                  This alert indicates a potential brute-force credential attack from external IP addresses.
                  The pattern of {selected.mitre_tactics.join(" → ")} is consistent with known APT tactics.
                  Recommend immediate account lockout and IP block.
                </p>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Event Timeline</h3>
                <div className="space-y-3">
                  {[
                    { time: "10:00:01", event: "First failed authentication attempt detected" },
                    { time: "10:00:15", event: "Failed login count exceeded threshold (10 in 5m)" },
                    { time: "10:00:15", event: "Alert triggered by rule: Multiple Failed Logins" },
                    { time: "10:00:16", event: "Alert published to queue" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-slate-600 font-mono w-16 flex-shrink-0">{item.time}</span>
                      <div className="flex-1">
                        <div className="w-px h-full bg-[#1E293B] absolute" />
                        <p className="text-sm text-slate-300">{item.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600">
            <div className="text-center">
              <AlertTriangle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an alert to investigate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
