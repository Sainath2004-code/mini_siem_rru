"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, Filter, RefreshCw, Bell, User, Zap, ShieldAlert, Cpu, ExternalLink } from "lucide-react"
import { alertsApi, aiApi } from "@/lib/api"
import { format } from "date-fns"

const SEV_LEVELS = {
  critical: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", glow: "shadow-[0_0_10px_rgba(239,68,68,0.2)]" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20", glow: "shadow-[0_0_10px_rgba(249,115,22,0.2)]" },
  medium: { color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20", glow: "" },
  low: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", glow: "" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await alertsApi.list()
      setAlerts(res.alerts || [])
      if (res.alerts?.length > 0) setSelected(res.alerts[0])
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!selected) return
    setAiLoading(true)
    setAiSummary(null)
    try {
      const { request_id } = await aiApi.summarizeAlert(
        selected.id,
        selected.title,
        selected.severity,
        selected.source_events || []
      )
      
      // Poll for result
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const res = await aiApi.getResult(request_id)
        if (res.status === "done") {
          setAiSummary(res.result || "")
          setAiLoading(false)
          clearInterval(poll)
        } else if (attempts > 10) {
          setAiLoading(false)
          clearInterval(poll)
        }
      }, 2000)
    } catch (err) {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex h-full bg-[#0A0B0E] text-slate-300 overflow-hidden">
      {/* Alert Queue Sidebar */}
      <div className="w-[450px] border-r border-[#1E293B] flex flex-col bg-[#0A0B0E]">
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Bell size={18} className="text-red-500" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Incident Queue</h2>
          </div>
          <button onClick={fetchAlerts} className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-slate-500">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Accessing Threat Feed...</span>
            </div>
          ) : (
            alerts.map(alert => {
              const Sev = SEV_LEVELS[alert.severity as keyof typeof SEV_LEVELS] || SEV_LEVELS.low
              return (
                <div 
                  key={alert.id} 
                  onClick={() => setSelected(alert)}
                  className={`p-6 border-b border-[#1E293B] cursor-pointer transition-all hover:bg-[#12141C] relative group ${selected?.id === alert.id ? 'bg-[#12141C]' : ''}`}
                >
                  {selected?.id === alert.id && <div className="absolute left-0 top-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${Sev.bg} ${Sev.color} ${Sev.glow}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {format(new Date(alert.created_at), "HH:mm:ss")}
                    </span>
                  </div>
                  <h3 className={`text-sm font-semibold mb-2 group-hover:text-white transition-colors ${selected?.id === alert.id ? 'text-white' : 'text-slate-300'}`}>
                    {alert.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Cpu size={12} /> {alert.source || 'Unknown'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{alert.status}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Investigation Workspace */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-[#0A0B0E] relative">
          {/* Header */}
          <div className="p-8 border-b border-[#1E293B] bg-[#12141C]/30 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${SEV_LEVELS[selected.severity as keyof typeof SEV_LEVELS]?.bg} ${SEV_LEVELS[selected.severity as keyof typeof SEV_LEVELS]?.color}`}>
                  {selected.severity} INCIDENT
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {selected.id}</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{selected.title}</h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User size={14} className="text-slate-600" />
                  Assignee: <span className="text-slate-200">{selected.assignee || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={14} className="text-slate-600" />
                  Triggered: <span className="text-slate-200">{format(new Date(selected.created_at), "PPP p")}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <CheckCircle size={14} /> RESOLVE
              </button>
              <button className="p-3 border border-[#1E293B] bg-[#12141A] rounded-xl text-slate-400 hover:text-white transition-colors">
                <ExternalLink size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="max-w-5xl space-y-12">
              
              {/* AI Triage Section */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-all" />
                <div className="relative p-8 rounded-2xl border border-cyan-500/20 bg-[#12141A] shadow-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Zap size={32} className="text-cyan-500/10" />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <Zap size={20} className="text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">SentinelX AI Insight</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Automated Incident Triage</p>
                    </div>
                  </div>

                  {aiLoading ? (
                    <div className="flex items-center gap-3 py-4 animate-pulse">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                      <span className="text-xs font-mono text-cyan-500/60 uppercase">Analyzing attack patterns...</span>
                    </div>
                  ) : aiSummary ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {aiSummary}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-6 border border-dashed border-[#1E293B] rounded-xl">
                      <p className="text-xs text-slate-600 font-medium">No AI summary generated for this incident.</p>
                      <button 
                        onClick={handleSummarize}
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 text-[10px] font-bold rounded-lg border border-cyan-500/20 uppercase tracking-widest"
                      >
                        Run AI Triage
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* MITRE Mapping */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-violet-500" />
                  MITRE ATT&CK Mapping
                </h3>
                <div className="flex gap-3 flex-wrap">
                  {selected.mitre_tactics?.map((t: string) => (
                    <div key={t} className="px-4 py-2 bg-violet-500/10 text-violet-400 text-xs font-bold rounded-xl border border-violet-500/20">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Investigation Timeline */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1 h-3 bg-red-500" />
                  Event Correlation Timeline
                </h3>
                <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#1E293B]">
                  {[
                    { time: "0s", title: "Rule Triggered", desc: "Detection rule 'Multiple Failed Logins' exceeded threshold.", type: "system" },
                    { time: "12s", title: "Alert Published", desc: "Incident created and broadcasted to SOC operators.", type: "system" },
                    { time: "45s", title: "Context Enrichment", desc: "GeoIP: Moscow, Russia. ISP: Rostelecom. ASN: 12389.", type: "enrichment" },
                  ].map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-10 top-1.5 w-4 h-4 rounded-full bg-[#0A0B0E] border-2 border-slate-700 z-10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      </div>
                      <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#12141A] hover:border-slate-500 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wide">{step.title}</h4>
                          <span className="text-[10px] font-mono text-slate-600">+{step.time}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-6 opacity-10">
          <ShieldAlert size={128} />
          <h2 className="text-2xl font-black uppercase tracking-[0.5em]">Awaiting Triage</h2>
        </div>
      )}
    </div>
  )
}
