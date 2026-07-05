"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, User, Stethoscope, Loader2, CalendarX, Edit } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'

interface Appointment {
  id: string
  appointmentNumber: string
  tokenNumber: number
  time: string
  date: string
  consultationType: string
  status: string
  patient: {
    id: string
    name: string
    uhid: string
  }
  doctor: {
    user: {
      name: string
    }
  }
  department: {
    name: string
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_progress':
      return 'warning'
    case 'waiting':
      return 'default'
    case 'scheduled':
      return 'secondary'
    case 'cancelled':
      return 'destructive'
    default:
      return 'default'
  }
}

export default function AppointmentsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const canBookAppointment = user?.role !== 'doctor'
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchAppointments()
  }, [filterStatus])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.set('status', filterStatus)
      }
      const res = await fetch(`/api/appointments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast('Failed to fetch appointments', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage patient appointments and schedules</p>
        </div>
        {canBookAppointment && (
          <Link href="/patients/register">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'scheduled', 'waiting', 'in_progress', 'completed'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No appointments found</p>
              {canBookAppointment && (
                <Link href="/patients/register">
                  <Button className="mt-4" size="sm">Book Appointment</Button>
                </Link>
              )}
            </div>
          ) : (
            appointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/patients/${appointment.patient.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{appointment.patient.name}</h3>
                          <Badge variant="secondary">{appointment.appointmentNumber}</Badge>
                          <Badge variant="outline">Token #{appointment.tokenNumber}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {appointment.patient.uhid}
                          </div>
                          <div className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4" />
                            Dr. {appointment.doctor.user.name}
                          </div>
                          <div>{appointment.department.name}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{appointment.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{new Date(appointment.date).toLocaleDateString()}</p>
                      <Badge variant={getStatusColor(appointment.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}>
                        {appointment.status.replace('_', ' ')}
                      </Badge>
                      {(appointment.status === 'scheduled' || appointment.status === 'waiting') && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Link href={`/appointments/${appointment.id}/edit`}>
                            <Button variant="ghost" size="sm" className="mt-2">
                              <Edit className="mr-1 h-3 w-3" /> Edit
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
