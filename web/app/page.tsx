"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Hospital,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  BedDouble,
  FileText,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const features = [
    {
      title: "Real-time Bed Occupancy",
      description: "Track ward occupancy, bed status, and patient allocations instantly.",
      icon: BedDouble,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      title: "Integrated OPD Queue",
      description: "Manage patient arrivals, consultations, and doctor assignments in real-time.",
      icon: Activity,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Smart Pharmacy & Lab",
      description: "Dispense prescriptions and upload reports directly to patient profiles.",
      icon: FileText,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Automated Billing",
      description: "Auto-generate invoices for OPD visits and room charges upon IPD discharge.",
      icon: DollarSign,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20"
    }
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-600/10 blur-[130px]" />

      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hospital className="h-8 w-8 text-blue-500" />
            <span className="font-bold text-xl tracking-tight text-white">Rs Nexus HMS</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center py-20 px-6 max-w-5xl mx-auto relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-semibold tracking-wide uppercase mx-auto mb-8 animate-pulse">
          <Zap className="h-3.5 w-3.5" /> Next-Gen Hospital Operations
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Streamline Hospital Care with <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">Rs Nexus</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          A comprehensive, role-based Hospital Management System engineered to optimize patient check-in, OPD queue, ward occupancy, lab integrations, and auto-billing.
        </p>

        <div className="flex justify-center gap-4 mb-16">
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm transition-all hover:border-slate-800 hover:bg-slate-900/60"
            >
              <div className={`p-3 w-fit rounded-xl border mb-4 ${feature.color}`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Banner */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-slate-500 text-xs tracking-wider uppercase relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Secure Role-Based Access Control (RBAC)
          </div>
          <div>© {new Date().getFullYear()} Rs Nexus. All rights reserved.</div>
        </div>
      </footer>
    </main>
  )
}

