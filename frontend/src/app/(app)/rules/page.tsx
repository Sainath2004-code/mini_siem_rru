"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Shield, Activity, BarChart3, Fingerprint, Search, Info } from "lucide-react"

const RULE_TYPES = {
  threshold: { icon: BarChart3, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  simple: { icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  sigma: { icon: Fingerprint, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
}

const SEV_LEVELS = {
  critical: "text-red-500",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
}

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock fetch - in production, this would be alertsApi.listRules()
    setTimeout(() => {
      const mockRules = [
        { id: "r1", name: "Multiple Failed Logins", rule_type: "threshold", severity: "high", enabled: true, mitre_tactics: ["Credential Access"], condition: { "event_type": "authentication", "action": "failure" }, threshold: 10, window_sec: 300, triggers: 24 },
        { id: "r2", name: "Suspicious PowerShell", rule_type: "simple", severity: "critical", enabled: true, mitre_tactics: ["Execution"], condition: { "process_name": "powershell.exe" }, triggers: 3 },
        { id: "r3", name: "Impossible Travel", rule_type: "threshold", severity: "high", enabled: true, mitre_tactics: ["Initial Access"], condition: { "event_type": "authentication" }, triggers: 1 },
      ]
      setRules(mockRules)
      setSelected(mockRules[0])
      setLoading(false)
    }, 500)
  }, [])

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="flex h-full bg-[#0A0B0E] text-slate-300">
      {/* Rule Navigation */}
      <div className="w-[400px] border-r border-[#1E293B] flex flex-col bg-[#0A0B0E]">
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Shield size={18} className="text-cyan-500" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Rules Engine</h2>
          </div>
          <button className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-cyan-500">
            <Plus size={20} />
          </button>
        </div>

        <div className="p-4 bg-[#12141A]/50 border-b border-[#1E293B]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input 
              placeholder="Search detection rules..." 
              className="w-full bg-[#0A0B0E] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center opacity-30 text-xs uppercase tracking-widest">Synchronizing...</div>
          ) : (
            rules.map(rule => {
              const TypeInfo = RULE_TYPES[rule.rule_type as keyof typeof RULE_TYPES]
              return (
                <div 
                  key={rule.id} 
                  onClick={() => setSelected(rule)}
                  className={`p-5 border-b border-[#1E293B] cursor-pointer transition-all hover:bg-[#12141C] relative group ${selected?.id === rule.id ? 'bg-[#12141C]' : ''}`}
                >
                  {selected?.id === rule.id && <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded border ${TypeInfo.border} ${TypeInfo.bg} ${TypeInfo.color}`}>
                      <TypeInfo.icon size={10} />
                      {rule.rule_type}
                    </span>
                    <button onClick={e => { e.stopPropagation(); toggleRule(rule.id) }} className={`${rule.enabled ? 'text-emerald-500' : 'text-slate-700'} hover:scale-110 transition-all`}>
                      {rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                  <h3 className={`text-sm font-semibold mb-2 group-hover:text-white transition-colors ${selected?.id === rule.id ? 'text-white' : 'text-slate-300'}`}>{rule.name}</h3>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <span className={SEV_LEVELS[rule.severity as keyof typeof SEV_LEVELS]}>{rule.severity}</span>
                    <span>{rule.triggers} hits today</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Rule Detail / Editor */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-[#0A0B0E]">
          <div className="p-8 border-b border-[#1E293B] bg-[#12141C]/30 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{selected.name}</h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${selected.enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                  {selected.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-slate-500">ID: <span className="font-mono">{selected.id}</span> • Last synced 2m ago</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold rounded-lg transition-all border border-slate-700 hover:border-slate-500">
                <Edit size={14} /> EDIT
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-lg transition-all border border-red-500/20">
                <Trash2 size={14} /> DELETE
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="max-w-4xl space-y-10">
              {/* Metadata Stats */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "Severity", value: selected.severity.toUpperCase(), color: SEV_LEVELS[selected.severity as keyof typeof SEV_LEVELS] },
                  { label: "Type", value: selected.rule_type.toUpperCase(), color: "text-slate-300" },
                  { label: "Window", value: `${selected.window_sec}s` || "None", color: "text-slate-300" },
                  { label: "Threshold", value: selected.threshold || "1", color: "text-slate-300" },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A] shadow-lg">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-1">{stat.label}</span>
                    <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* MITRE ATT&CK */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-violet-500" />
                  MITRE ATT&CK Coverage
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {selected.mitre_tactics.map((t: string) => (
                    <div key={t} className="px-4 py-2 bg-violet-500/10 text-violet-400 text-xs font-bold rounded-xl border border-violet-500/20 flex items-center gap-2">
                      <Fingerprint size={12} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition Inspector */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-500" />
                  Detection logic
                </h3>
                <div className="relative group">
                  <pre className="p-8 rounded-2xl border border-[#1E293B] bg-[#0A0B0E] text-cyan-400 font-mono text-sm leading-relaxed overflow-x-auto shadow-inner">
                    {JSON.stringify(selected.condition, null, 2)}
                  </pre>
                  <button className="absolute top-4 right-4 p-2 bg-[#1E293B] hover:bg-[#334155] rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Info size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Alert Preview */}
              <div className="p-6 rounded-2xl border border-dashed border-[#1E293B] bg-[#12141A]/30 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1E293B]">
                  <Activity size={20} className="text-slate-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Visual Trace Placeholder</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">This rule triggers on event density spikes across the ingestion stream.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center opacity-20">
          <Shield size={64} />
        </div>
      )}
    </div>
  )
}
