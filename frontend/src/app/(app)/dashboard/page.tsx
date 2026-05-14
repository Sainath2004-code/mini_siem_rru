"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, AlertTriangle, ShieldAlert, Zap, Shield, Globe, Cpu, Clock } from "lucide-react"
import { createSentinelXWebSocket } from "@/lib/api"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    eps: 12400,
    alerts: 142,
    incidents: 8,
    lag: 120
  })
  const [liveAlerts, setLiveAlerts] = useState<any[]>([
    { id: 1, title: "Multiple Failed Logins", time: "Just now", sev: "high", src: "192.168.1.45" },
    { id: 2, title: "Suspicious PowerShell", time: "2m ago", sev: "critical", src: "WIN-SRV-02" },
    { id: 3, title: "Impossible Travel", time: "5m ago", sev: "high", src: "alice@acme.com" },
  ])

  useEffect(() => {
    const ws = createSentinelXWebSocket((data) => {
      if (data.type === "metric_tick") {
        setMetrics({
          eps: data.eps,
          alerts: data.active_alerts,
          incidents: data.open_incidents,
          lag: data.ingestion_lag_ms
        })
      } else if (data.type === "new_alert") {
        setLiveAlerts(prev => [data.alert, ...prev].slice(0, 10))
      }
    })

    return () => ws.close()
  }, [])

  return (
    <div className="p-6 bg-[#0A0B0E] min-h-screen text-slate-300 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">SOC Command Center</h1>
          <p className="text-sm text-slate-500">Real-time threat landscape and operational intelligence</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">System Status</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Fully Operational
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPI Cards */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          {[
            { label: "Events Per Second", value: metrics.eps.toLocaleString(), delta: "Live Stream", icon: Activity, color: "from-cyan-500/20 to-transparent", border: "border-cyan-500/20", glow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]" },
            { label: "Active Alerts", value: metrics.alerts, delta: "Last 24h", icon: ShieldAlert, color: "from-red-500/20 to-transparent", border: "border-red-500/20", glow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]" },
            { label: "Open Incidents", value: metrics.incidents, delta: "Requires Triage", icon: AlertTriangle, color: "from-amber-500/20 to-transparent", border: "border-amber-500/20", glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]" },
            { label: "Ingestion Lag", value: `${metrics.lag}ms`, delta: "Network Latency", icon: Clock, color: "from-violet-500/20 to-transparent", border: "border-violet-500/20", glow: "shadow-[0_0_15px_rgba(139,92,246,0.1)]" },
          ].map((card) => (
            <div key={card.label} className={`p-5 rounded-2xl border ${card.border} bg-[#12141C] ${card.glow} transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${card.color.split(' ')[0]}`} />
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{card.label}</span>
                <card.icon size={18} className="text-slate-600 group-hover:text-white transition-colors" />
              </div>
              <div className="text-4xl font-light text-white tracking-tight">{card.value}</div>
              <div className="text-[10px] text-slate-600 mt-2 font-mono uppercase tracking-widest">{card.delta}</div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* Threat Radar / Map */}
          <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#12141C] flex-1 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-cyan-500" />
                <h3 className="text-sm font-semibold text-white tracking-wide">Threat Intel Map</h3>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Inbound Attacks
                </div>
              </div>
            </div>
            <div className="aspect-[16/9] bg-[#0A0B0E] rounded-xl border border-[#1E293B] flex items-center justify-center relative group">
               {/* Cyberpunk Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="text-center z-10 opacity-40 group-hover:opacity-100 transition-opacity">
                <Shield size={48} className="mx-auto mb-4 text-slate-800" />
                <p className="text-sm font-mono text-slate-600">MAPBOX_ENGINE_INITIALIZING...</p>
              </div>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="p-6 rounded-2xl border border-[#1E293B] bg-[#12141C]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-violet-500" />
                <h3 className="text-sm font-semibold text-white tracking-wide">Telemetry Volume (24h)</h3>
              </div>
            </div>
            <div className="h-32 flex items-end gap-1.5">
              {Array.from({ length: 48 }).map((_, i) => {
                const h = Math.floor(Math.random() * 100)
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-cyan-500/40 to-cyan-500/10 rounded-full hover:from-cyan-400 hover:to-cyan-200 transition-all cursor-pointer group relative"
                    style={{ height: `${Math.max(10, h)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {h}k
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Live Feed Sidebar */}
        <div className="col-span-4 p-6 rounded-2xl border border-[#1E293B] bg-[#12141C] flex flex-col h-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-white tracking-wide">Live Alert Stream</h3>
            </div>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 animate-pulse">
              LIVE
            </span>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {liveAlerts.map((alert) => (
              <div key={alert.id} className="p-4 rounded-xl border border-[#1E293B] bg-[#0A0B0E] hover:border-cyan-500/40 transition-all cursor-pointer group relative overflow-hidden">
                 <div className={`absolute left-0 top-0 w-1 h-full ${
                  alert.sev === 'critical' ? 'bg-red-500' : 
                  alert.sev === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                    alert.sev === "critical" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    alert.sev === "high"     ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                               "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                  }`}>{alert.sev}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{alert.time}</span>
                </div>
                <h4 className="text-sm font-medium text-slate-200 group-hover:text-white mb-2">{alert.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                  <Cpu size={12} />
                  {alert.src}
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-3 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold rounded-xl transition-all border border-transparent hover:border-slate-500 uppercase tracking-widest">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  )
}
