"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, AlertTriangle, ShieldAlert, Zap, Shield, Globe, Cpu, Clock, TrendingUp } from "lucide-react"
import { createSentinelXWebSocket, searchApi, alertsApi } from "@/lib/api"
import { format } from "date-fns"
import AttackMap from "@/components/AttackMap"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    eps: 0,
    alerts: 0,
    incidents: 0,
    lag: 0
  })
  const [liveAlerts, setLiveAlerts] = useState<any[]>([])
  const [volumeData, setVolumeData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Initial Data Fetch
    fetchDashboardState()

    // 2. WebSocket Subscription
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

  const fetchDashboardState = async () => {
    try {
      // Fetch real volume data from ClickHouse
      const agg = await searchApi.aggregate("*")
      setVolumeData(agg.buckets || [])
      
      // Fetch latest alerts
      const res = await alertsApi.list()
      setLiveAlerts(res.alerts?.slice(0, 10) || [])
      
      setLoading(false)
    } catch (err) {
      console.error("Dashboard sync failed:", err)
    }
  }

  return (
    <div className="p-6 bg-[#0A0B0E] min-h-screen text-slate-300 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <Shield size={24} className="text-cyan-500" />
            SOC Command Center
          </h1>
          <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">Operational Telemetry Hub</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Platform Status</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
              SYSCAP_ACTIVE_PROD
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* KPI Cards */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          {[
            { label: "Events Per Second", value: metrics.eps.toLocaleString(), sub: "Throughput", icon: Activity, color: "from-cyan-500/10", border: "border-cyan-500/20" },
            { label: "Active Alerts", value: metrics.alerts, sub: "Last 24h", icon: ShieldAlert, color: "from-red-500/10", border: "border-red-500/20" },
            { label: "Open Incidents", value: metrics.incidents, sub: "Triage Required", icon: AlertTriangle, color: "from-amber-500/10", border: "border-amber-500/20" },
            { label: "Pipeline Latency", value: `${metrics.lag}ms`, sub: "SLA Status", icon: Clock, color: "from-violet-500/10", border: "border-violet-500/20" },
          ].map((card) => (
            <div key={card.label} className={`p-6 rounded-2xl border ${card.border} bg-[#12141C] transition-all hover:bg-[#151824] duration-300 group`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
                  <card.icon size={16} className="text-slate-400 group-hover:text-white" />
                </div>
                <TrendingUp size={14} className="text-emerald-500 opacity-50" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter mb-1">{card.value}</div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{card.label}</span>
                <span className="text-[10px] font-bold text-slate-500 italic">{card.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Threat Map Section */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="p-8 rounded-3xl border border-[#1E293B] bg-[#12141C] flex-1 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 flex gap-4 z-20">
               <div className="px-3 py-1.5 bg-[#0A0B0E]/80 backdrop-blur rounded-lg border border-[#1E293B] text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                 Live Incursions
               </div>
            </div>
            <div className="flex items-center gap-3 mb-8">
              <Globe size={20} className="text-cyan-500" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Ingress Vector</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black">Real-time Geolocation Intelligence</p>
              </div>
            </div>
            <div className="aspect-[21/9] bg-[#0A0B0E] rounded-2xl border border-[#1E293B] relative group">
              <AttackMap alerts={liveAlerts} />
            </div>
          </div>

          {/* Real Ingestion Chart */}
          <div className="p-8 rounded-3xl border border-[#1E293B] bg-[#12141C] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-violet-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest text-shadow-glow">Flow density (Last 24h)</h3>
              </div>
            </div>
            <div className="h-40 flex items-end gap-1.5 px-2">
              {volumeData.length > 0 ? volumeData.map((bucket, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 rounded-t-sm hover:from-cyan-400 hover:to-white transition-all cursor-pointer group relative"
                  style={{ height: `${(bucket.count / Math.max(...volumeData.map(b => b.count))) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0A0B0E] border border-[#1E293B] text-[9px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all font-mono z-50 pointer-events-none">
                    {bucket.count.toLocaleString()}
                  </div>
                </div>
              )) : (
                <div className="w-full h-full flex items-center justify-center border border-dashed border-[#1E293B] rounded-xl opacity-20">
                   <span className="text-xs font-black uppercase tracking-widest">Awaiting historical data...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Triage Sidebar */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="flex-1 p-8 rounded-3xl border border-[#1E293B] bg-[#12141C] flex flex-col shadow-2xl relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/5 blur-[80px] rounded-full" />
             <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-amber-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Sentinel Pulse</h3>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Live</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {liveAlerts.length > 0 ? liveAlerts.map((alert) => (
                <div key={alert.id} className="p-5 rounded-2xl border border-[#1E293B] bg-[#0A0B0E] hover:border-cyan-500/30 transition-all cursor-pointer group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 w-1 h-full ${alert.severity === 'critical' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-amber-500'}`} />
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      alert.severity === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    }`}>{alert.severity}</span>
                    <span className="text-[10px] text-slate-600 font-mono italic">{format(new Date(alert.created_at), "HH:mm:ss")}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors mb-3 leading-snug">{alert.title}</h4>
                  <div className="flex items-center gap-2 text-[9px] text-slate-600 font-mono uppercase font-black">
                    <Cpu size={12} className="text-slate-700" />
                    {alert.source || 'SYS_UNKNOWN'}
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                  <ShieldAlert size={48} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Passive Monitoring Active</p>
                </div>
              )}
            </div>

            <button className="mt-8 w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-95 uppercase tracking-[0.2em]">
              Access Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
