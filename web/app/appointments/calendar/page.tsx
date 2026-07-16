"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, User, Stethoscope, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Appointment {
  id: string
  appointmentNumber: string
  tokenNumber: number
  time: string
  date: string
  consultationType: string
  status: string
  patient: { name: string; uhid: string }
  doctor: { user: { name: string }; id: string }
  department: { name: string }
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'waiting': return 'default'
    case 'scheduled': return 'secondary'
    case 'cancelled': return 'destructive'
    default: return 'default'
  }
}

export default function CalendarPage() {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [currentDate])

  // Local YYYY-MM-DD (avoids the UTC shift that toISOString() introduces west
  // of UTC, which pushed the whole week onto the wrong day).
  const toLocalDateStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      // Load the whole visible week, not just the current day — the grid
      // renders 7 columns and previously only one was ever populated.
      const week = getWeekDays()
      const from = toLocalDateStr(week[0])
      const to = toLocalDateStr(week[week.length - 1])
      const res = await fetch(`/api/appointments?from=${from}&to=${to}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(Array.isArray(data) ? data : [])
      }
    } catch { toast('Failed to fetch appointments', 'error') }
    finally { setLoading(false) }
  }

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors')
      if (res.ok) setDoctors(await res.json())
    } catch { toast('Failed to fetch doctors', 'error') }
  }

  const getWeekDays = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = toLocalDateStr(date)
    let filtered = appointments.filter(a => a.date.split('T')[0] === dateStr)
    if (selectedDoctor !== 'all') {
      filtered = filtered.filter(a => a.doctor.id === selectedDoctor)
    }
    return filtered.sort((a, b) => a.time.localeCompare(b.time))
  }

  const getAppointmentsForSlot = (date: Date, time: string) => {
    return getAppointmentsForDay(date).filter(a => a.time === time)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  const weekDays = getWeekDays()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/appointments">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Calendar</h1>
            <p className="text-gray-600 mt-1">Weekly view of all appointments</p>
          </div>
          <Link href="/patients/register">
            <Button><Plus className="mr-2 h-4 w-4" /> Book Appointment</Button>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter Doctor:</span>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">All Doctors</option>
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="p-2 text-xs font-medium text-gray-500">Time</div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`p-2 text-center rounded-t-lg ${
                    isToday(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <p className="text-xs font-medium">{dayNames[day.getDay()]}</p>
                  <p className="text-lg font-bold">{day.getDate()}</p>
                  <p className="text-xs">{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="border rounded-lg">
              {timeSlots.map((time, timeIdx) => (
                <div key={time} className={`grid grid-cols-8 gap-1 ${timeIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="p-2 text-xs font-medium text-gray-500 border-r flex items-start pt-3">
                    {time}
                  </div>
                  {weekDays.map((day, dayIdx) => {
                    const slotAppts = getAppointmentsForSlot(day, time)
                    return (
                      <div
                        key={dayIdx}
                        className={`border-r last:border-r-0 p-1 min-h-[60px] ${
                          isToday(day) ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {slotAppts.map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity ${
                              apt.status === 'completed'
                                ? 'bg-green-100 border border-green-200'
                                : apt.status === 'in_progress'
                                ? 'bg-yellow-100 border border-yellow-200'
                                : apt.status === 'cancelled'
                                ? 'bg-red-100 border border-red-200'
                                : 'bg-blue-100 border border-blue-200'
                            }`}
                            title={`${apt.patient.name} - ${apt.doctor.user.name}`}
                          >
                            <p className="font-medium truncate">{apt.patient.name}</p>
                            <p className="text-gray-600 truncate">Dr. {apt.doctor.user.name}</p>
                            <Badge
                              variant={getStatusColor(apt.status) as "default" | "secondary" | "destructive" | "outline" | "success" | "warning"}
                              className="text-[10px] mt-0.5"
                            >
                              #{apt.tokenNumber}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <span className="font-medium">Legend:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></span> Scheduled
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span> In Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span> Completed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Cancelled
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
