"use client"
import { Search, Zap, SlidersHorizontal, BookmarkPlus } from "lucide-react"
import { useState } from "react"

const EXAMPLE_QUERIES = [
  "severity=critical AND source_ip=192.168.*",
  "event_type=authentication AND action=failure | count by source_ip",
  "source=cloudtrail AND user=root",
  "process_name=powershell.exe AND cmdline~-enc",
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results] = useState<any[]>([])

  return (
    <div className="flex flex-col h-full bg-[#0A0B0E] p-6">
      <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Search size={20} className="text-cyan-400" />
        Threat Hunting Workspace
      </h1>

      {/* Query Input */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="severity=high AND source_ip=10.* | count by hostname | sort desc | limit 50"
            className="w-full bg-[#12141A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Zap size={14} /> Run
        </button>
        <button className="p-3 border border-[#1E293B] rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"><SlidersHorizontal size={16} /></button>
        <button className="p-3 border border-[#1E293B] rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"><BookmarkPlus size={16} /></button>
      </div>

      {/* Example Queries */}
      <div className="flex gap-2 flex-wrap mb-6">
        <span className="text-xs text-slate-600">Quick:</span>
        {EXAMPLE_QUERIES.map(q => (
          <button key={q} onClick={() => setQuery(q)}
            className="px-2 py-1 bg-[#12141A] border border-[#1E293B] text-xs text-slate-400 rounded font-mono hover:text-cyan-400 hover:border-cyan-500/30 transition-colors truncate max-w-[240px]">
            {q}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 rounded-xl border border-dashed border-[#1E293B] bg-[#12141A] flex items-center justify-center text-slate-600">
        {results.length === 0 ? (
          <div className="text-center">
            <Search size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Run a query to see results</p>
            <p className="text-xs mt-1 text-slate-700">Results stream from ClickHouse in real-time</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
