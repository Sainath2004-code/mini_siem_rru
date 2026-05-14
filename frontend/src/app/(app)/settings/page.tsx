import { Settings, User, Key, Bell, Plug, Shield } from "lucide-react"

const SECTIONS = [
  { icon: User, label: "Profile", desc: "Manage your name, email, and avatar" },
  { icon: Shield, label: "Security", desc: "MFA, sessions, and password" },
  { icon: Key, label: "API Keys", desc: "Create and revoke agent ingestion keys" },
  { icon: Bell, label: "Notifications", desc: "Slack, email, and PagerDuty alerts" },
  { icon: Plug, label: "Integrations", desc: "Connected log sources and webhooks" },
  { icon: Settings, label: "Organization", desc: "Tenant settings, users, and roles" },
]

export default function SettingsPage() {
  return (
    <div className="p-6 bg-[#0A0B0E] min-h-full">
      <h1 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Settings size={20} className="text-slate-400" /> Settings
      </h1>
      <div className="grid grid-cols-3 gap-4">
        {SECTIONS.map(s => (
          <div key={s.label} className="p-5 rounded-xl border border-[#1E293B] bg-[#12141A] cursor-pointer hover:border-cyan-500/30 hover:bg-[#12141A] transition-all group">
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] group-hover:bg-cyan-500/10 flex items-center justify-center mb-4 transition-colors">
              <s.icon size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
            <p className="text-xs text-slate-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
