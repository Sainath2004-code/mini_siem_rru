"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, Filter, RefreshCw, User, Zap, ShieldAlert, MessageSquare, Link as LinkIcon, History, Activity } from "lucide-react"
import { incidentsApi } from "@/lib/api"
import { format } from "date-fns"

const SEV_LEVELS = {
  critical: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  medium: { color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
  low: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timeline' | 'alerts' | 'evidence'>('timeline')

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const data = await incidentsApi.list()
      setIncidents(data || [])
      if (data?.length > 0) setSelected(data[0])
    } catch (err) {
      console.error("Failed to fetch incidents:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full bg-[#0A0B0E] text-slate-300 overflow-hidden">
      {/* Incident Queue Sidebar */}
      <div className="w-[450px] border-r border-[#1E293B] flex flex-col bg-[#0A0B0E]">
        <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <ShieldAlert size={18} className="text-orange-500" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Incident Response</h2>
          </div>
          <button onClick={fetchIncidents} className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors text-slate-500">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-20 text-center opacity-30 text-[10px] uppercase tracking-[0.3em]">Synchronizing...</div>
          ) : (
            incidents.map(inc => {
              const Sev = SEV_LEVELS[inc.severity as keyof typeof SEV_LEVELS] || SEV_LEVELS.low
              return (
                <div 
                  key={inc.id} 
                  onClick={() => setSelected(inc)}
                  className={`p-6 border-b border-[#1E293B] cursor-pointer transition-all hover:bg-[#12141C] relative group ${selected?.id === inc.id ? 'bg-[#12141C]' : ''}`}
                >
                  {selected?.id === inc.id && <div className="absolute left-0 top-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${Sev.bg} ${Sev.color}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {format(new Date(inc.created_at), "MMM dd")}
                    </span>
                  </div>
                  <h3 className={`text-sm font-semibold mb-2 group-hover:text-white transition-colors ${selected?.id === inc.id ? 'text-white' : 'text-slate-300'}`}>
                    {inc.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><User size={12} /> {inc.assignee || 'Unassigned'}</span>
                    <span className={`px-1.5 py-0.5 rounded border ${inc.status === 'open' ? 'border-red-500/20 text-red-500' : 'border-slate-700 text-slate-500'}`}>
                      {inc.status}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Incident Detail Workspace */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-[#0A0B0E] relative">
          {/* Header */}
          <div className="p-8 border-b border-[#1E293B] bg-[#12141C]/30 flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${SEV_LEVELS[selected.severity as keyof typeof SEV_LEVELS]?.bg} ${SEV_LEVELS[selected.severity as keyof typeof SEV_LEVELS]?.color}`}>
                  INCIDENT #{selected.id.split('-')[0]}
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                  <Clock size={12} /> Created {format(new Date(selected.created_at), "PPP p")}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{selected.title}</h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{selected.description}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <CheckCircle size={14} /> CLOSE INCIDENT
              </button>
              <button className="p-3 border border-[#1E293B] bg-[#12141A] rounded-xl text-slate-400 hover:text-white transition-colors">
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-8 border-b border-[#1E293B] bg-[#0A0B0E] flex gap-8">
            {[
              { id: 'timeline', label: 'Attack Timeline', icon: Activity },
              { id: 'alerts', label: 'Linked Alerts', icon: AlertTriangle },
              { id: 'evidence', label: 'Evidence Vault', icon: LinkIcon },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-orange-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            {activeTab === 'timeline' && (
              <div className="max-w-4xl space-y-12">
                <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#1E293B]">
                  {/* Timeline Entry */}
                  <div className="relative">
                    <div className="absolute -left-10 top-1.5 w-5 h-5 rounded-full bg-[#0A0B0E] border-2 border-orange-500 z-10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316]" />
                    </div>
                    <div className="p-8 rounded-2xl border border-[#1E293B] bg-[#12141A] shadow-2xl">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">Initial Compromise Detected</h4>
                        <span className="text-[10px] font-mono text-slate-500">T=0s</span>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Multiple failed authentication attempts detected from unauthorized geolocations. Pattern suggests a coordinated brute-force campaign.
                      </p>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> Analyst Collaboration
                    </h3>
                    <div className="bg-[#12141A] rounded-2xl border border-[#1E293B] p-6">
                      <textarea 
                        placeholder="Add a technical note or observation..."
                        className="w-full bg-[#0A0B0E] border border-[#1E293B] rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500/50 min-h-[100px] mb-4"
                      />
                      <div className="flex justify-end">
                        <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all">
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="grid grid-cols-1 gap-4">
                {selected.alerts?.map((alert: any) => (
                  <div key={alert.id} className="p-6 rounded-2xl border border-[#1E293B] bg-[#12141A] flex justify-between items-center group hover:border-slate-500 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${SEV_LEVELS[alert.severity as keyof typeof SEV_LEVELS]?.bg} ${SEV_LEVELS[alert.severity as keyof typeof SEV_LEVELS]?.color}`}>
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">{alert.id}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-white transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-6 opacity-10">
          <Zap size={128} />
          <h2 className="text-2xl font-black uppercase tracking-[0.5em]">Command Hub Standby</h2>
        </div>
      )}
    </div>
  )
}
