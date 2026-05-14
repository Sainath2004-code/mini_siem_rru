"use client"
import { useState } from "react"
import { GitBranch, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react"

const INCIDENTS = [
  { id: "INC-001", title: "APT Lateral Movement Campaign", status: "open", severity: "critical", alerts: 12, created: "2026-05-14T08:00:00Z", assignee: "Alice", mitre: ["Initial Access", "Lateral Movement", "Privilege Escalation"] },
  { id: "INC-002", title: "Ransomware Pre-staging Activity", status: "in_progress", severity: "critical", alerts: 7, created: "2026-05-14T06:00:00Z", assignee: "Bob", mitre: ["Defense Evasion", "Impact"] },
  { id: "INC-003", title: "Credential Stuffing Attack", status: "open", severity: "high", alerts: 23, created: "2026-05-13T22:00:00Z", assignee: null, mitre: ["Credential Access"] },
]

const STATUS = {
  open: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  in_progress: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: Clock },
  resolved: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: CheckCircle },
}

export default function IncidentsPage() {
  const [selected, setSelected] = useState(INCIDENTS[0])

  return (
    <div className="flex h-full bg-[#0A0B0E] text-white">
      {/* Incident List */}
      <div className="w-80 border-r border-[#1E293B] flex flex-col">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <span className="text-sm font-semibold">Incidents</span>
          <button className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {INCIDENTS.map(inc => {
            const StatusIcon = STATUS[inc.status as keyof typeof STATUS].icon
            return (
              <div key={inc.id} onClick={() => setSelected(inc)}
                className={`p-4 border-b border-[#1E293B] cursor-pointer hover:bg-[#12141A] transition-all ${selected.id === inc.id ? "bg-[#12141A] border-l-2 border-l-cyan-500" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-500">{inc.id}</span>
                  <span className={`text-xs font-semibold ${inc.severity === "critical" ? "text-red-400" : "text-orange-400"}`}>{inc.severity.toUpperCase()}</span>
                </div>
                <p className="text-sm font-medium text-white mb-2">{inc.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{inc.alerts} alerts</span>
                  <span className={STATUS[inc.status as keyof typeof STATUS].color}>{inc.status.replace("_", " ")}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Incident Detail */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 border-b border-[#1E293B]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500">{selected.id}</span>
              <h1 className="text-2xl font-bold mt-1">{selected.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span>{selected.alerts} linked alerts</span>
                <span>Assigned: {selected.assignee || "Unassigned"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg">View Graph</button>
              <button className="px-3 py-1.5 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-lg">Add Note</button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* MITRE Chain */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Attack Chain (MITRE ATT&CK)</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {selected.mitre.map((tactic, i) => (
                <div key={tactic} className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-violet-500/10 text-violet-300 text-sm rounded-lg border border-violet-500/20">{tactic}</span>
                  {i < selected.mitre.length - 1 && <span className="text-slate-600">→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Investigation Timeline</h3>
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-[#1E293B]" />
              <div className="space-y-4 ml-7">
                {[
                  { time: "08:00", type: "alert", text: "First alert triggered: Multiple Failed Logins" },
                  { time: "08:05", type: "alert", text: "Lateral movement detected to WIN-SRV-02" },
                  { time: "08:12", type: "action", text: "Incident created by automated correlation" },
                  { time: "08:20", type: "note", text: "Alice: Investigating source IP 185.220.x.x — likely TOR exit node" },
                  { time: "09:00", type: "alert", text: "Privilege escalation detected on WIN-SRV-02" },
                ].map((item, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`absolute -left-9 w-4 h-4 rounded-full border-2 ${item.type === "alert" ? "border-red-500 bg-red-500/20" : item.type === "note" ? "border-cyan-500 bg-cyan-500/20" : "border-slate-500 bg-slate-500/20"}`} />
                    <div>
                      <span className="text-xs text-slate-600 font-mono">{item.time}</span>
                      <p className="text-sm text-slate-300 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
