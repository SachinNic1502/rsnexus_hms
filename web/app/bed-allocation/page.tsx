"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BedDouble, Loader2, User, CalendarDays, Stethoscope, Bed, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { BedAllocationModal } from '@/components/bed-allocation-modal'
import { useAuth } from '@/lib/auth-context'

// ─── Types (shapes returned by the APIs this page consumes) ──────────────
interface Admission {
  id: string
  admissionNumber: string
  admissionDate: string
  status: string
  patient: { name: string; uhid: string }
  doctor: { user: { name: string } } | null
  ward: { name: string; type: string } | null
  room: { roomNumber: string } | null
  bed: { bedNumber: string } | null
}

function daysSince(dateStr: string): number {
  return Math.max(1, Math.ceil((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)))
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function BedAllocationPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  // Admins have read-only access to bed allocation — they can view the data
  // but not assign beds. Other roles keep the "Assign Ward & Bed" action.
  const isAdmin = user?.role === 'super_admin' || user?.role === 'hospital_admin'
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [allocating, setAllocating] = useState<Admission | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const admRes = await fetch('/api/admissions?status=admitted')
      if (admRes.ok) { const d = await admRes.json(); setAdmissions(Array.isArray(d) ? d : []) }
    } catch {
      toast('Failed to load bed allocation data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const awaiting = admissions.filter((a) => !a.bed)
  const allocated = admissions.filter((a) => a.bed)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bed Allocation</h1>
        <p className="text-gray-600 mt-1">Assign admitted patients to a ward, room and bed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Admitted Patients', value: admissions.length, icon: User, color: 'text-blue-500' },
          { label: 'Awaiting Bed', value: awaiting.length, icon: BedDouble, color: 'text-amber-500' },
          { label: 'Bed Allocated', value: allocated.length, icon: CheckCircle2, color: 'text-green-500' },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : admissions.length === 0 ? (
        <div className="text-center py-16">
          <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No admitted patients</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Awaiting allocation first — these need action */}
          {awaiting.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Awaiting Bed Allocation ({awaiting.length})</h2>
              <div className="grid gap-4">
                {awaiting.map((a) => (
                  <AdmissionCard key={a.id} admission={a} onAllocate={isAdmin ? undefined : () => setAllocating(a)} />
                ))}
              </div>
            </div>
          )}

          {allocated.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">Bed Allocated ({allocated.length})</h2>
              <div className="grid gap-4">
                {allocated.map((a) => (
                  <AdmissionCard key={a.id} admission={a} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <BedAllocationModal
        admission={allocating}
        onClose={() => setAllocating(null)}
        onAllocated={() => { setAllocating(null); fetchData() }}
      />
    </div>
  )
}

// ─── Admission card ──────────────────────────────────────────────────────
function AdmissionCard({ admission, onAllocate }: { admission: Admission; onAllocate?: () => void }) {
  const hasBed = Boolean(admission.bed)
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className={`p-3 rounded-full ${hasBed ? 'bg-green-100' : 'bg-amber-100'}`}>
              <BedDouble className={`h-6 w-6 ${hasBed ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{admission.patient.name}</h3>
                <Badge variant="secondary">{admission.admissionNumber}</Badge>
                <Badge variant={admission.status === 'admitted' ? 'success' : 'secondary'}>{admission.status}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 mt-2">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" /> UHID: {admission.patient.uhid}</span>
                <span className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-gray-400" /> {admission.doctor ? `Dr. ${admission.doctor.user.name}` : 'Doctor N/A'}</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gray-400" /> Admitted: {formatDateTime(admission.admissionDate)}</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gray-400" /> {daysSince(admission.admissionDate)} day(s) admitted</span>
              </div>

              {hasBed && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <Badge className="bg-slate-100 text-slate-700">Ward: {admission.ward?.name}</Badge>
                  <Badge className="bg-slate-100 text-slate-700">Room: {admission.room?.roomNumber}</Badge>
                  <Badge className="bg-slate-100 text-slate-700">Bed: {admission.bed?.bedNumber}</Badge>
                  <Badge variant="destructive">Occupied</Badge>
                </div>
              )}
            </div>
          </div>

          {!hasBed && onAllocate && (
            <Button onClick={onAllocate} className="shrink-0">
              <Bed className="mr-2 h-4 w-4" /> Assign Ward &amp; Bed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
