"use client"
import { useState } from "react"
import { Shield, Eye, EyeOff, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9102"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error("Invalid credentials")
      const data = await res.json()
      localStorage.setItem("sx_token", data.access_token)
      localStorage.setItem("sx_user", JSON.stringify(data.user))
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Shield className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SentinelX SIEM</h1>
          <p className="text-slate-500 text-sm mt-1">Security Operations Center</p>
        </div>

        {/* Card */}
        <div className="bg-[#12141A] border border-[#1E293B] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign in to your workspace</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your SOC credentials to continue</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="analyst@yoursoc.io"
                className="w-full bg-[#0A0B0E] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0A0B0E] border border-[#1E293B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <><Zap size={16} /> Access SOC Platform</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            Protected by enterprise-grade encryption · MFA supported
          </p>
        </div>

        <p className="text-center text-xs text-slate-700 mt-4">
          SentinelX SIEM v1.0 · Multi-tenant Cloud-Native
        </p>
      </div>
    </div>
  )
}
