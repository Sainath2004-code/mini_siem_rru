"use client"

import { useState } from "react"
import { Search, Zap, SlidersHorizontal, BookmarkPlus, Clock, Database, ChevronRight, FileJson } from "lucide-react"
import { searchApi } from "@/lib/api"
import { format } from "date-fns"

const EXAMPLE_QUERIES = [
  "severity=critical",
  "event_type=authentication AND event_outcome=failure",
  "source_ip=192.168.* AND destination_port=22",
  "process_name:powershell AND severity=high",
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)
    try {
      const res = await searchApi.search(query)
      setResults(res.results)
      setStats({
        total: res.total,
        latency: res.latency_ms,
        sql: res.query_sql
      })
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0B0E] p-6 text-slate-300">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-white flex items-center gap-3">
          <Database size={20} className="text-cyan-500" />
          Threat Hunting Workspace
        </h1>
        <div className="flex items-center gap-4 text-xs font-mono">
          {stats && (
            <span className="text-slate-500">
              {stats.total} events in {stats.latency}ms
            </span>
          )}
        </div>
      </div>

      {/* Query Section */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="severity=high AND source_ip=10.* | count by hostname"
              className="w-full bg-[#12141A] border border-[#1E293B] rounded-xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner" 
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] active:scale-95"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Zap size={16} />}
            RUN
          </button>
          <button className="p-4 border border-[#1E293B] bg-[#12141A] rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center">Templates:</span>
          {EXAMPLE_QUERIES.map(q => (
            <button 
              key={q} 
              onClick={() => setQuery(q)}
              className="px-3 py-1.5 bg-[#12141A] border border-[#1E293B] text-[11px] text-slate-500 rounded-lg font-mono hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Results Table */}
        <div className="flex-1 rounded-2xl border border-[#1E293B] bg-[#12141A] flex flex-col overflow-hidden shadow-2xl">
          <div className="grid grid-cols-[180px_100px_120px_150px_1fr] gap-4 px-6 py-4 bg-[#0A0B0E] border-b border-[#1E293B] text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Timestamp</span>
            <span>Severity</span>
            <span>Type</span>
            <span>Source IP</span>
            <span>Message / Raw</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {results.length > 0 ? (
              results.map((log, i) => (
                <div 
                  key={log.id || i}
                  onClick={() => setSelectedLog(log)}
                  className={`grid grid-cols-[180px_100px_120px_150px_1fr] gap-4 px-6 py-3 border-b border-[#0F1218] hover:bg-cyan-500/5 cursor-pointer transition-colors items-center group ${selectedLog?.id === log.id ? 'bg-cyan-500/5' : ''}`}
                >
                  <span className="text-[11px] font-mono text-slate-500">
                    {format(new Date(log.timestamp), "MMM dd, HH:mm:ss.SSS")}
                  </span>
                  <span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                      log.severity === 'high' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {log.severity}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium truncate">{log.event_type}</span>
                  <span className="text-[11px] text-cyan-500/80 font-mono">{log.source_ip || "-"}</span>
                  <span className="text-[11px] text-slate-300 truncate font-mono">
                    {log.raw}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center flex-col opacity-30">
                <Search size={48} className="mb-4" />
                <p className="text-sm font-medium">Ready for investigation</p>
                <p className="text-xs mt-1">SXQL Query Translated to ClickHouse in real-time</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedLog && (
          <div className="w-[450px] rounded-2xl border border-[#1E293B] bg-[#12141A] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#1E293B] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <FileJson size={16} className="text-cyan-500" />
                Event Inspector
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] custom-scrollbar">
              <div className="space-y-6">
                {Object.entries(selectedLog).map(([k, v]) => (
                  <div key={k} className="group">
                    <div className="text-slate-600 mb-1 group-hover:text-cyan-500/60 transition-colors uppercase font-black tracking-tighter">{k}</div>
                    <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#1E293B] text-slate-200 break-all whitespace-pre-wrap">
                      {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
