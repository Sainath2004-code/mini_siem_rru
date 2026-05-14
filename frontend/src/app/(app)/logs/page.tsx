"use client"
import { useState } from "react"
import { Search, Clock, ChevronDown, Download, SlidersHorizontal, Zap } from "lucide-react"

const SAMPLE_LOGS = Array.from({ length: 50 }, (_, i) => ({
  id: `log-${i}`,
  timestamp: new Date(Date.now() - i * 3000).toISOString(),
  source: ["syslog", "cloudtrail", "k8s", "windows-evt", "firewall"][i % 5],
  severity: ["info", "warning", "error", "critical"][i % 4],
  hostname: `node-${(i % 8) + 1}.internal`,
  user: ["alice", "bob", "svc-api", "root", null][i % 5],
  source_ip: `10.${(i % 4) + 1}.${(i % 8) + 1}.${(i % 50) + 1}`,
  event_type: ["authentication", "process_creation", "network_connection", "file_access", "api_call"][i % 5],
  action: ["success", "failure", "blocked", "allowed"][i % 4],
  message: `Event ${i}: ${["User logged in", "Process spawned", "Connection established", "File read", "API called"][i % 5]}`
}))

const SEV_COLOR = {
  info: "text-blue-400",
  warning: "text-yellow-400",
  error: "text-orange-400",
  critical: "text-red-400",
}

export default function LogsPage() {
  const [query, setQuery] = useState("")
  const [logs] = useState(SAMPLE_LOGS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [autoScroll] = useState(true)

  const filtered = logs.filter(l =>
    !query || JSON.stringify(l).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-[#0A0B0E]">
      {/* Search Bar */}
      <div className="p-4 border-b border-[#1E293B] bg-[#0A0B0E]">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='severity=critical AND source_ip=10.* | last 1h'
              className="w-full bg-[#12141A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold rounded-lg transition-colors">
            <Zap size={14} />
            Search
          </button>
          <button className="p-2.5 border border-[#1E293B] rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
            <SlidersHorizontal size={16} />
          </button>
          <button className="p-2.5 border border-[#1E293B] rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
            <Download size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock size={10} /> Last 1 hour</span>
          <span>|</span>
          <span className="font-mono text-slate-400">{filtered.length.toLocaleString()} events</span>
          {autoScroll && <span className="flex items-center gap-1 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live tail active</span>}
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[160px_80px_120px_80px_100px_80px_1fr] gap-0 px-4 py-2 text-[10px] font-medium text-slate-600 uppercase tracking-wider border-b border-[#1E293B] bg-[#0A0B0E]">
        <span>Timestamp</span>
        <span>Severity</span>
        <span>Source</span>
        <span>Action</span>
        <span>Host</span>
        <span>User</span>
        <span>Message</span>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {filtered.map(log => (
          <div key={log.id}>
            <div
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
              className="grid grid-cols-[160px_80px_120px_80px_100px_80px_1fr] gap-0 px-4 py-1.5 border-b border-[#0F1218] hover:bg-[#12141A] cursor-pointer transition-colors group items-center"
            >
              <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={SEV_COLOR[log.severity as keyof typeof SEV_COLOR]}>{log.severity}</span>
              <span className="text-cyan-400/80">{log.source}</span>
              <span className={log.action === "failure" || log.action === "blocked" ? "text-red-400" : "text-green-400"}>
                {log.action}
              </span>
              <span className="text-slate-400 truncate">{log.hostname}</span>
              <span className="text-violet-400">{log.user || "-"}</span>
              <span className="text-slate-300 truncate group-hover:text-white transition-colors">{log.message}</span>
            </div>

            {/* Expanded Detail */}
            {expanded === log.id && (
              <div className="px-6 py-4 bg-[#12141A] border-b border-[#1E293B] text-[11px]">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(log).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-600 uppercase">{k.replace(/_/g, " ")}</span>
                      <p className="text-slate-200 mt-0.5">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
