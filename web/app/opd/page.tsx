"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Clock, User, ClipboardCheck, Loader2, Receipt, Users } from 'lucide-react'
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
  patient: { name: string; uhid: string; id: string }
  doctor: { user: { name: string }; id: string }
  department: { name: string }
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

  useEffect(() => { fetchTodayAppointments() }, [])

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/appointments?date=${today}`)
      if (res.ok) { const data = await res.json(); setAppointments(Array.isArray(data) ? data : []) }
    } catch (e) { toast('Failed to fetch OPD data', 'error') }
    finally { setLoading(false) }
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
              onClick={() => router.push(`/patients/${apt.patient.id}`)}
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
                    {apt.status === 'completed' && (
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
    </div>
  )
}