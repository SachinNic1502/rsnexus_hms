"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Loader2, Receipt, Users, CheckCircle, Search, RefreshCw, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface PatientQueueItem {
  id: string
  appointmentNumber: string
  tokenNumber: number
  time: string
  date: string
  status: string
  patient: {
    id: string
    name: string
    uhid: string
    mobile?: string
  }
  doctor: {
    id: string
    name: string
  }
  department: string
  isAdmitted: boolean
  hasInvoice: boolean
  invoiceId: string | null
  consultationId: string | null
}

export default function OPDBillingQueuePage() {
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [queue, setQueue] = useState<PatientQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'billed' | 'ipd'>('all')
  const [countdown, setCountdown] = useState(15)

  useEffect(() => {
    fetchBillingQueue()

    const refreshInterval = setInterval(() => {
      fetchBillingQueue()
      setCountdown(15)
    }, 15000)

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 15))
    }, 1000)

    return () => {
      clearInterval(refreshInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  const fetchBillingQueue = async () => {
    try {
      const res = await fetch('/api/opd/billing-queue')
      if (res.ok) {
        const data = await res.json()
        setQueue(Array.isArray(data) ? data : [])
      } else {
        throw new Error('Failed to load queue')
      }
    } catch (e) {
      toast('Failed to fetch OPD billing queue', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      item.patient.uhid.toLowerCase().includes(search.toLowerCase()) ||
      item.doctor.name.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'pending') return !item.hasInvoice && !item.isAdmitted
    if (filter === 'billed') return item.hasInvoice
    if (filter === 'ipd') return item.isAdmitted

    return true
  })

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'nurse', 'billing_staff']}>
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">OPD Billing Queue</h1>
          <p className="text-gray-500 mt-1">Manage billing for patients with completed consultations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border shadow-sm px-3.5 py-2 rounded-lg">
            <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
            <span>Auto-refreshing in <span className="font-semibold text-blue-600">{countdown}s</span></span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 ml-1 hover:bg-slate-100 rounded-md"
              onClick={() => {
                fetchBillingQueue()
                setCountdown(15)
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Completed</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{queue.length}</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Pending Bill</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {queue.filter((q) => !q.hasInvoice && !q.isAdmitted).length}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Billed</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {queue.filter((q) => q.hasInvoice).length}
              </h3>
            </div>
            <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-slate-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">IPD Patients</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {queue.filter((q) => q.isAdmitted).length}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'pending', 'billed', 'ipd'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              className="capitalize text-sm font-medium"
              onClick={() => setFilter(f)}
            >
              {f === 'ipd' ? 'IPD Admitted' : f === 'pending' ? 'Pending Bill' : f}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search patient, UHID or doctor..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : filteredQueue.length === 0 ? (
        <Card className="border border-dashed border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-800">No Patients Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              There are no completed consultations matching your filter criteria right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQueue.map((item) => (
            <Card key={item.id} className="hover:shadow-sm transition-all border border-slate-100 bg-white">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-center min-w-[50px] border">
                    <span className="font-bold text-lg text-slate-700">#{item.tokenNumber}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-base">{item.patient.name}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.patient.uhid}
                      </span>
                      {item.isAdmitted ? (
                        <Badge variant="secondary" className="font-semibold text-xs py-0.5">IPD Admitted</Badge>
                      ) : item.hasInvoice ? (
                        <Badge variant="success" className="font-semibold text-xs py-0.5">Billed</Badge>
                      ) : (
                        <Badge variant="warning" className="font-semibold text-xs py-0.5">Pending Bill</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Doctor: <strong className="text-slate-700">Dr. {item.doctor.name}</strong></span>
                      <span>Department: <strong className="text-slate-700">{item.department}</strong></span>
                      <span>Time: <strong className="text-slate-700">{item.time}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {item.isAdmitted ? (
                    <div className="flex flex-col items-end">
                      <Badge className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-3 py-1 rounded">
                        IPD Billing Flow
                      </Badge>
                      <span className="text-[10px] text-slate-400 mt-1">Dues cleared in final IPD discharge bill</span>
                    </div>
                  ) : item.hasInvoice ? (
                    <Link href={`/billing/${item.invoiceId}/receipt`}>
                      <Button variant="outline" size="sm" className="font-semibold flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> View Receipt
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/billing/visit/${item.id}`}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm">
                        <Receipt className="h-3.5 w-3.5" /> Generate Bill
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </RoleGuard>
  )
}
