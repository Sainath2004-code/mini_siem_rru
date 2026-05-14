import { Activity, AlertTriangle, ShieldAlert, Zap, Shield } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="p-6 bg-[#0A0B0E] min-h-full">
      <div className="grid grid-cols-12 gap-6">

        {/* KPI Cards */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          {[
            { label: "Active Alerts", value: "142", delta: "↑ 12% last hour", deltaColor: "text-red-400", icon: ShieldAlert, iconColor: "text-red-400" },
            { label: "Ingestion Rate", value: "12.4k", delta: "Events / sec", deltaColor: "text-emerald-400", icon: Activity, iconColor: "text-cyan-400" },
            { label: "Open Incidents", value: "8", delta: "2 high severity", deltaColor: "text-slate-500", icon: AlertTriangle, iconColor: "text-amber-400" },
            { label: "AI Analysis", value: "Active", delta: "Scanning threats", deltaColor: "text-slate-500", icon: Zap, iconColor: "text-violet-400" },
          ].map((card) => (
            <div key={card.label} className="p-4 rounded-xl border border-[#1E293B] bg-[#12141A] shadow-sm flex flex-col justify-between hover:border-[#334155] transition-colors">
              <div className="flex justify-between items-start text-slate-500 mb-4">
                <span className="text-xs font-medium uppercase tracking-wider">{card.label}</span>
                <card.icon size={16} className={card.iconColor} />
              </div>
              <div className="text-3xl font-light text-white">{card.value}</div>
              <div className={`text-xs mt-2 ${card.deltaColor}`}>{card.delta}</div>
            </div>
          ))}
        </div>

        {/* Threat Map Placeholder */}
        <div className="col-span-8 p-4 rounded-xl border border-[#1E293B] bg-[#12141A] min-h-[380px] flex flex-col">
          <div className="text-sm font-medium text-white mb-4 flex justify-between items-center">
            Global Threat Origins
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> High</span>
            </div>
          </div>
          <div className="flex-1 bg-[#0A0B0E] rounded-lg flex items-center justify-center text-slate-700 border border-dashed border-[#1E293B] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="text-center z-10">
              <Shield size={32} className="mx-auto mb-2 text-slate-700" />
              <p className="text-sm">Mapbox GL / ECharts Geo Map</p>
              <p className="text-xs mt-1 text-slate-700">Connect Mapbox API key to enable</p>
            </div>
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="col-span-4 p-4 rounded-xl border border-[#1E293B] bg-[#12141A] min-h-[380px] flex flex-col">
          <div className="text-sm font-medium text-white mb-4 flex justify-between items-center">
            Live Alert Feed
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Realtime
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-auto pr-1">
            {[
              { id: 1, title: "Multiple Failed Logins", time: "Just now", sev: "high", src: "192.168.1.45" },
              { id: 2, title: "Suspicious PowerShell", time: "2m ago", sev: "critical", src: "WIN-SRV-02" },
              { id: 3, title: "Impossible Travel", time: "5m ago", sev: "high", src: "alice@acme.com" },
              { id: 4, title: "Unusual Outbound Traffic", time: "12m ago", sev: "medium", src: "10.0.0.5" },
              { id: 5, title: "AWS Root Login", time: "15m ago", sev: "critical", src: "CloudTrail" },
            ].map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg border border-[#1E293B] bg-[#0A0B0E] hover:border-cyan-500/30 cursor-pointer transition-colors group">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    alert.sev === "critical" ? "bg-red-500/20 text-red-400" :
                    alert.sev === "high"     ? "bg-orange-500/20 text-orange-400" :
                                               "bg-blue-500/20 text-blue-400"
                  }`}>{alert.sev.toUpperCase()}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{alert.time}</span>
                </div>
                <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{alert.title}</div>
                <div className="text-xs text-slate-600 mt-1 font-mono">{alert.src}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Timeline */}
        <div className="col-span-12 p-4 rounded-xl border border-[#1E293B] bg-[#12141A]">
          <div className="text-sm font-medium text-white mb-4">Event Volume — Last 24h</div>
          <div className="flex items-end gap-1 h-20">
            {Array.from({ length: 48 }, (_, i) => {
              const h = Math.floor(Math.random() * 80) + 10
              return (
                <div key={i} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/40 rounded-sm transition-colors cursor-pointer"
                  style={{ height: `${h}%` }} title={`${h} events`} />
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
          </div>
        </div>

      </div>
    </div>
  )
}
