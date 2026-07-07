"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Hospital, KeyRound, Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const demoAccounts = [
    { label: 'Admin', email: 'admin@rsnexus.com', bg: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' },
    { label: 'Doctor', email: 'doctor@rsnexus.com', bg: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20' },
    { label: 'Nurse', email: 'nurse@rsnexus.com', bg: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20' },
    { label: 'Pharmacist', email: 'pharmacist@rsnexus.com', bg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' },
    { label: 'Lab Tech', email: 'lab@rsnexus.com', bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/20' },
    { label: 'Billing', email: 'billing@rsnexus.com', bg: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/20' },
    { label: 'Receptionist', email: 'receptionist@rsnexus.com', bg: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20' },
  ]

  const fillCredentials = (accEmail: string) => {
    setEmail(accEmail)
    setPassword('password')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(email, password)
    
    if (success) {
      router.push('/dashboard')
    } else {
      setError('Email or password is incorrect')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600/10 blur-[130px]" />

      <Card className="w-full max-w-lg bg-slate-900/60 border-slate-800/80 backdrop-blur-md relative z-10 shadow-2xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500">
              <Hospital className="h-10 w-10" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-white font-extrabold tracking-tight">Rs Nexus HMS</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Sign in to access your role-based dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@rsnexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950/60 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950/60 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-blue-500"
              />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-600/10" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Developer / Demo accounts click-to-fill helper */}
          <div className="border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-blue-400 uppercase tracking-wide">
              <Sparkles className="h-4 w-4" /> Quick Demo Login (Click to Fill)
            </div>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((acc, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillCredentials(acc.email)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:scale-105 active:scale-95 ${acc.bg}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

