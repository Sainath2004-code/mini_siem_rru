"use client"
import { Shield, Activity, AlertTriangle, Search, Terminal, GitBranch, Settings, Bell, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/dashboard", icon: Activity, label: "Dashboard" },
  { href: "/alerts", icon: AlertTriangle, label: "Alerts" },
  { href: "/incidents", icon: GitBranch, label: "Incidents" },
  { href: "/logs", icon: Terminal, label: "Live Logs" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/rules", icon: Shield, label: "Rules" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0B0E] text-white">
      {/* Sidebar */}
      <aside className="w-14 flex-shrink-0 flex flex-col items-center py-4 border-r border-[#1E293B] bg-[#0A0B0E] z-10">
        <div className="mb-6 w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Shield size={18} className="text-cyan-400" />
        </div>
        <nav className="flex flex-col gap-1 flex-1 w-full px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link key={href} href={href}
                className={`relative flex items-center justify-center w-full h-10 rounded-lg transition-all group ${
                  active ? "bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.3)]"
                         : "text-slate-600 hover:text-slate-300 hover:bg-[#1E293B]"
                }`}
                title={label}
              >
                <Icon size={17} />
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#1E293B] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-[#334155]">
                  {label}
                </span>
                {active && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-400" />}
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-col gap-1 w-full px-2">
          <button className="flex items-center justify-center w-full h-10 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-[#1E293B] transition-all group relative" title="Logout">
            <LogOut size={17} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[#1E293B] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-[#334155]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-12 border-b border-[#1E293B] flex items-center px-4 justify-between bg-[#0A0B0E] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              SENTINEL<span className="text-cyan-400">X</span>
            </span>
            <span className="text-[#1E293B]">|</span>
            <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
              {NAV_ITEMS.find(n => pathname === n.href || pathname.startsWith(n.href + "/"))?.label || "SOC Platform"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2 py-1 bg-[#1E293B] rounded text-slate-400">EPS: <span className="text-emerald-400">12,450</span></span>
            <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400">CRIT: 3</span>
            <button className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-[#1E293B] transition-colors relative">
              <Bell size={15} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold text-xs">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
