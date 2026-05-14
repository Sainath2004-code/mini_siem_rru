"use client"
import { useState } from "react"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Shield } from "lucide-react"

const RULES = [
  { id: "r1", name: "Multiple Failed Logins", type: "threshold", severity: "high", enabled: true, mitre: ["Credential Access"], condition: "event_type=authentication AND action=failure | count > 10 within 5m", triggers_today: 24 },
  { id: "r2", name: "Suspicious PowerShell", type: "sigma", severity: "high", enabled: true, mitre: ["Execution", "Defense Evasion"], condition: "process_name=powershell.exe AND cmdline~-enc", triggers_today: 3 },
  { id: "r3", name: "Impossible Travel", type: "behavioral", severity: "high", enabled: true, mitre: ["Initial Access"], condition: "event_type=authentication AND travel_speed_kmh > 900", triggers_today: 1 },
  { id: "r4", name: "AWS Root Account Login", type: "threshold", severity: "critical", enabled: true, mitre: ["Privilege Escalation"], condition: "source=cloudtrail AND user=root", triggers_today: 2 },
  { id: "r5", name: "Data Exfiltration Volume", type: "threshold", severity: "medium", enabled: false, mitre: ["Exfiltration"], condition: "event_type=network_connection AND bytes_out > 100MB", triggers_today: 0 },
]

const TYPE_BADGE = {
  threshold: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  sigma: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  behavioral: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
}
const SEV_COLOR = { critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-blue-400" }

export default function RulesPage() {
  const [rules, setRules] = useState(RULES)
  const [selected, setSelected] = useState(RULES[0])

  const toggleRule = (id: string) => {
    setRules(r => r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
  }

  return (
    <div className="flex h-full bg-[#0A0B0E] text-white">
      {/* Rule List */}
      <div className="w-96 border-r border-[#1E293B] flex flex-col">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold">Detection Rules</span>
            <span className="text-xs text-slate-500 font-mono">({rules.filter(r => r.enabled).length} active)</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/20 transition-colors">
            <Plus size={12} /> New Rule
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {rules.map(rule => (
            <div key={rule.id} onClick={() => setSelected(rule)}
              className={`p-4 border-b border-[#1E293B] cursor-pointer hover:bg-[#12141A] transition-all ${selected.id === rule.id ? "bg-[#12141A] border-l-2 border-l-cyan-500" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${TYPE_BADGE[rule.type as keyof typeof TYPE_BADGE]}`}>{rule.type}</span>
                <button onClick={e => { e.stopPropagation(); toggleRule(rule.id) }}
                  className={`${rule.enabled ? "text-emerald-400" : "text-slate-600"} transition-colors`}>
                  {rule.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
              <p className="text-sm font-medium text-white mb-1">{rule.name}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className={SEV_COLOR[rule.severity as keyof typeof SEV_COLOR]}>{rule.severity}</span>
                <span>{rule.triggers_today} triggers today</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rule Editor */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{selected.name}</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1E293B] text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
              <Edit size={12} /> Edit
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A]">
            <p className="text-xs text-slate-500 mb-1">Type</p>
            <span className={`text-sm font-semibold px-2 py-0.5 rounded border ${TYPE_BADGE[selected.type as keyof typeof TYPE_BADGE]}`}>{selected.type}</span>
          </div>
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A]">
            <p className="text-xs text-slate-500 mb-1">Severity</p>
            <p className={`text-sm font-semibold ${SEV_COLOR[selected.severity as keyof typeof SEV_COLOR]}`}>{selected.severity.toUpperCase()}</p>
          </div>
          <div className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A]">
            <p className="text-xs text-slate-500 mb-1">Triggers Today</p>
            <p className="text-sm font-semibold text-white">{selected.triggers_today}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">MITRE ATT&CK</h3>
          <div className="flex gap-2 flex-wrap">
            {selected.mitre.map(t => (
              <span key={t} className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-sm rounded-lg border border-violet-500/20">{t}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detection Condition</h3>
          <pre className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A] text-sm text-cyan-300 font-mono whitespace-pre-wrap overflow-auto">
            {selected.condition}
          </pre>
        </div>
      </div>
    </div>
  )
}
