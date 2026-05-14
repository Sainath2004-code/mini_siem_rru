import { Activity, AlertTriangle, ShieldAlert, Zap, Search, Bell, Settings, Terminal, Shield, Grid } from "lucide-react"

export default function SOCDashboard() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-16 flex flex-col items-center py-4 border-r border-border bg-card">
        <div className="mb-8 p-2 bg-primary/20 rounded-lg text-primary">
          <Shield size={24} />
        </div>
        <nav className="flex flex-col gap-6 flex-1 text-muted-foreground">
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors group relative">
            <Grid size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors group relative text-primary">
            <Activity size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors group relative">
            <AlertTriangle size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors group relative">
            <Search size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors group relative">
            <Terminal size={20} />
          </button>
        </nav>
        <div className="flex flex-col gap-4 text-muted-foreground">
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary hover:text-foreground transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border flex items-center px-6 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              SOC COMMAND CENTER
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">EPS: 12,450</span>
              <span className="px-2 py-1 bg-secondary rounded text-xs font-mono text-destructive">CRITICAL: 3</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* KPI Cards */}
            <div className="col-span-12 grid grid-cols-4 gap-6">
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-muted-foreground mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Alerts</span>
                  <ShieldAlert size={16} className="text-destructive" />
                </div>
                <div className="text-3xl font-light">142</div>
                <div className="text-xs text-destructive mt-2 flex items-center gap-1">
                  ↑ 12% from last hour
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-muted-foreground mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider">Ingestion Rate</span>
                  <Activity size={16} className="text-primary" />
                </div>
                <div className="text-3xl font-light">12.4k</div>
                <div className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                  Events / sec
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-muted-foreground mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider">Open Incidents</span>
                  <AlertTriangle size={16} className="text-amber-500" />
                </div>
                <div className="text-3xl font-light">8</div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  2 high severity
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start text-muted-foreground mb-4">
                  <span className="text-xs font-medium uppercase tracking-wider">AI Analysis</span>
                  <Zap size={16} className="text-accent" />
                </div>
                <div className="text-3xl font-light">Active</div>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  Scanning threat streams
                </div>
              </div>
            </div>

            {/* Main Threat Map / Chart Area */}
            <div className="col-span-8 p-4 rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
              <div className="text-sm font-medium mb-4 flex justify-between items-center">
                Global Threat Origins
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" />
                </div>
              </div>
              <div className="flex-1 bg-secondary/50 rounded-lg flex items-center justify-center text-muted-foreground border border-dashed border-border">
                [ Mapbox / ECharts Geo Visualization goes here ]
              </div>
            </div>

            {/* Live Alert Feed */}
            <div className="col-span-4 p-4 rounded-xl border border-border bg-card shadow-sm min-h-[400px] flex flex-col">
              <div className="text-sm font-medium mb-4 flex justify-between items-center">
                Live Alert Feed
                <span className="text-xs text-muted-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Realtime</span>
              </div>
              <div className="flex-1 flex flex-col gap-3 overflow-auto pr-2">
                {/* Dummy Alerts */}
                {[
                  { id: 1, title: "Multiple Failed Logins", time: "Just now", sev: "high", src: "192.168.1.45" },
                  { id: 2, title: "Suspicious PowerShell Execution", time: "2m ago", sev: "critical", src: "WIN-SRV-02" },
                  { id: 3, title: "Impossible Travel Detected", time: "5m ago", sev: "high", src: "alice@acme.com" },
                  { id: 4, title: "Unusual Outbound Traffic", time: "12m ago", sev: "medium", src: "10.0.0.5" },
                  { id: 5, title: "AWS Root Login", time: "15m ago", sev: "critical", src: "CloudTrail" },
                ].map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border border-border bg-background hover:border-primary/50 cursor-pointer transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        alert.sev === 'critical' ? 'bg-destructive/20 text-destructive' :
                        alert.sev === 'high' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-primary/20 text-primary'
                      }`}>{alert.sev.toUpperCase()}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{alert.time}</span>
                    </div>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">{alert.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{alert.src}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
