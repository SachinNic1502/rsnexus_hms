"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Clock, User, ClipboardCheck, Loader2, Receipt, Users, BedDouble } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'

interface Appointment {
  id: string
  appointmentNumber: string
  tokenNumber: number
  time: string
  status: string
  consultationType: string
  // `admissions` is the patient's currently active admission (if any) — used
  // to route the card to the OPD Patient Details (Admission) page instead of
  // the plain patient profile.
  patient: { name: string; uhid: string; id: string; admissions?: { id: string }[] }
  doctor: { user: { name: string }; id: string }
  department: { name: string }
}

interface Admission {
  id: string
  admissionNumber: string
  admissionDate: string
  status: string
  patient: { name: string; uhid: string; id: string }
  doctor: { user: { name: string }; id: string }
  ward: { name: string } | null
  room: { roomNumber: string } | null
  bed: { bedNumber: string } | null
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'waiting': return 'default'
    case 'scheduled': return 'secondary'
    default: return 'default'
  }
}

export default function OPDPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const canConsult = user?.role !== 'super_admin'
  const canInitiateConsult = canConsult && user?.role !== 'nurse'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [admissionsLoading, setAdmissionsLoading] = useState(true)

  // Re-run when the logged-in user resolves so doctors get a scoped queue.
  useEffect(() => { fetchTodayAppointments(); fetchAdmittedPatients() }, [user])

  // A doctor's OPD queue/admitted list is scoped to patients assigned to
  // that doctor; other roles see everything.
  const resolveDoctorId = async (): Promise<string | null> => {
    if (user?.role !== 'doctor') return null
    try {
      const meRes = await fetch('/api/doctors/me')
      if (meRes.ok) {
        const me = await meRes.json()
        if (me?.id) return me.id as string
      }
    } catch { /* fall back to unscoped queue if lookup fails */ }
    return null
  }

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      // includeOverdue: a patient checked in on a previous day and never
      // marked completed/cancelled should stay in the queue, not silently
      // disappear once the date rolls over.
      let url = `/api/appointments?date=${today}&includeOverdue=true`
      const doctorId = await resolveDoctorId()
      if (doctorId) url += `&doctorId=${doctorId}`
      const res = await fetch(url)
      if (res.ok) { const data = await res.json(); setAppointments(Array.isArray(data) ? data : []) }
    } catch (e) { toast('Failed to fetch OPD data', 'error') }
    finally { setLoading(false) }
  }

  // Admitted patients remain visible here (independent of today's date)
  // until they are discharged, since doctors/nurses have no separate IPD
  // menu access.
  const fetchAdmittedPatients = async () => {
    try {
      let url = '/api/admissions?status=admitted'
      const doctorId = await resolveDoctorId()
      if (doctorId) url += `&doctorId=${doctorId}`
      const res = await fetch(url)
      if (res.ok) { const data = await res.json(); setAdmissions(Array.isArray(data) ? data : []) }
    } catch (e) { toast('Failed to fetch admitted patients', 'error') }
    finally { setAdmissionsLoading(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTodayAppointments()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">OPD Queue</h1>
        <p className="text-gray-600 mt-1">Today&apos;s patient queue and check-in management</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No patients in queue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card
              key={apt.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // Admitted patients open the OPD Patient Details (Admission)
                // page; everyone else opens the Patient Details page.
                const admissionId = apt.patient.admissions?.[0]?.id
                router.push(admissionId ? `/ipd/${admissionId}` : `/patients/${apt.patient.id}`)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <Badge variant="outline" className="text-lg font-bold">#{apt.tokenNumber}</Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{apt.patient.name}</h3>
                        <span className="text-xs text-gray-500">{apt.patient.uhid}</span>
                        {apt.consultationType === 'follow_up' && <Badge variant="outline">Follow-up</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Dr. {apt.doctor.user.name}</span>
                        <span>{apt.department.name}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Badge variant={getStatusColor(apt.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>{apt.status.replace('_', ' ')}</Badge>
                    {apt.status === 'scheduled' && (
                      <Button size="sm" onClick={() => updateStatus(apt.id, 'waiting')}>Check In</Button>
                    )}
                    {apt.status === 'waiting' && canInitiateConsult && (
                      <Link href={`/opd/consultation/${apt.id}`}>
                        <Button size="sm"><ClipboardCheck className="mr-1 h-3 w-3" /> Consult</Button>
                      </Link>
                    )}
                    {apt.status === 'in_progress' && canConsult && (
                      <Link href={`/opd/consultation/${apt.id}`}>
                        <Button size="sm" variant="outline">Continue</Button>
                      </Link>
                    )}
                    {/* Billing is a receptionist/billing_staff/admin concern,
                        not a doctor one — see RBAC table. */}
                    {apt.status === 'completed' && user?.role !== 'doctor' && (
                      <Link href={`/billing?patientId=${apt.patient.id}`}>
                        <Button size="sm" variant="ghost"><Receipt className="mr-1 h-3 w-3" /> Bill</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admitted Patients — since doctors/nurses have no IPD menu access,
          patients they've admitted stay visible here (regardless of today's
          date) until they are discharged. Clicking always opens the OPD
          Patient Details (Admission) page. */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Admitted Patients</h2>
        <p className="text-gray-600 text-sm mb-4">Patients currently admitted (IPD) — visible here until discharge</p>

        {admissionsLoading ? (
          <div className="flex items-center justify-center h-24"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : admissions.length === 0 ? (
          <div className="text-center py-8">
            <BedDouble className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No admitted patients</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admissions.map((a) => {
              const daysAdmitted = Math.max(1, Math.ceil((Date.now() - new Date(a.admissionDate).getTime()) / (1000 * 60 * 60 * 24)))
              return (
                <Card
                  key={a.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/ipd/${a.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-green-100"><BedDouble className="h-5 w-5 text-green-600" /></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{a.patient.name}</h3>
                            <span className="text-xs text-gray-500">{a.patient.uhid}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Dr. {a.doctor.user.name}</span>
                            {a.bed ? (
                              <span>{a.ward?.name} - Room {a.room?.roomNumber}, Bed {a.bed.bedNumber}</span>
                            ) : (
                              <span className="text-amber-600">Awaiting bed allocation</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Day {daysAdmitted}</span>
                        <Badge variant="success">Admitted</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}