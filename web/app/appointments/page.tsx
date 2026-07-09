"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, User, Stethoscope, Loader2, CalendarX, Edit, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
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
  patient: {
    name: string
    uhid: string
  }
  doctor: {
    id: string
    user: {
      name: string
    }
  }
  department: {
    name: string
  }
  invoices?: {
    id: string
    invoiceNumber: string
    total: number
    status: string
  }[]
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
]

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

const getBillingBadge = (invoices?: any[]) => {
  if (!invoices || invoices.length === 0) {
    return { text: 'Not Generated', variant: 'secondary' as const }
  }
  const status = invoices[0].status
  switch (status) {
    case 'paid':
      return { text: 'Paid', variant: 'success' as const }
    case 'partial':
      return { text: 'Partial', variant: 'warning' as const }
    case 'cancelled':
      return { text: 'Cancelled', variant: 'destructive' as const }
    case 'pending':
    default:
      return { text: 'Unpaid', variant: 'destructive' as const }
  }
}

export default function AppointmentsPage() {
  const { toast } = useToast()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  
  // List view filters
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Calendar view states
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [doctors, setDoctors] = useState<any[]>([])

  useEffect(() => {
    fetchAppointments()
  }, [view, filterStatus, currentDate])

  useEffect(() => {
    if (view === 'calendar') {
      fetchDoctors()
    }
  }, [view])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors')
      if (res.ok) setDoctors(await res.json())
    } catch {
      toast('Failed to fetch doctors', 'error')
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (view === 'list') {
        if (filterStatus !== 'all') {
          params.set('status', filterStatus)
        }
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

  // Calendar helpers
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
    const dateStr = date.toISOString().split('T')[0]
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage patient appointments and schedules</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center border rounded-lg p-0.5 bg-gray-50">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="text-xs h-8 px-3"
            >
              List View
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('calendar')}
              className="text-xs h-8 px-3"
            >
              Calendar View
            </Button>
          </div>

          <Link href="/appointments/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* Filters Section */}
          <div className="mb-6 border-b pb-6">
            {/* Status Filter Tabs */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Status</span>
              <div className="flex flex-wrap gap-2">
                {['all', 'scheduled', 'waiting', 'in_progress', 'completed'].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    onClick={() => setFilterStatus(status)}
                    className="h-9 text-xs px-3"
                  >
                    {status === 'all' ? 'All Statuses' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No appointments found</p>
                  <Link href="/appointments/new">
                    <Button className="mt-4" size="sm">Book Appointment</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                        <th className="p-4">Token</th>
                        <th className="p-4">Patient</th>
                        <th className="p-4">Doctor & Department</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4">Appt Status</th>
                        <th className="p-4">Bill Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {appointments.map((appointment) => {
                        const billInfo = getBillingBadge(appointment.invoices)
                        const invoice = appointment.invoices?.[0]
                        return (
                          <tr key={appointment.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-slate-900">#{appointment.tokenNumber}</td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-900">{appointment.patient.name}</div>
                              <div className="text-xs text-slate-500">{appointment.patient.uhid}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-slate-900">Dr. {appointment.doctor.user.name}</div>
                              <div className="text-xs text-slate-500">{appointment.department.name}</div>
                            </td>
                            <td className="p-4">
                              <div>{new Date(appointment.date).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-500">{appointment.time}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant={getStatusColor(appointment.status) as any}>
                                {appointment.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge variant={billInfo.variant}>
                                {billInfo.text}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end items-center">
                                {appointment.status === 'completed' && (
                                  <>
                                    {invoice ? (
                                      <Link href={`/billing/${invoice.id}/receipt`}>
                                        <Button size="sm" variant="outline" className="h-8 text-xs font-semibold flex items-center gap-1">
                                          <Receipt className="h-3.5 w-3.5" /> Receipt
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Link href={`/billing/visit/${appointment.id}`}>
                                        <Button size="sm" className="h-8 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
                                          <Receipt className="h-3.5 w-3.5" /> Bill
                                        </Button>
                                      </Link>
                                    )}
                                  </>
                                )}
                                {(appointment.status === 'scheduled' || appointment.status === 'waiting') && (
                                  <Link href={`/appointments/${appointment.id}/edit`}>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                                      <Edit className="mr-1 h-3 w-3" /> Edit
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Calendar Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-sm font-semibold whitespace-nowrap">
                    {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 whitespace-nowrap">Filter Doctor:</span>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
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
            <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
              <div className="min-w-[900px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-px bg-gray-200 border-b">
                  <div className="p-3 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center justify-center">Time Slot</div>
                  {weekDays.map((day, i) => (
                    <div
                      key={i}
                      className={`p-3 text-center ${
                        isToday(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider">{dayNames[day.getDay()]}</p>
                      <p className="text-base font-bold my-0.5">{day.getDate()}</p>
                      <p className="text-[10px] uppercase">{day.toLocaleDateString('en-US', { month: 'short' })}</p>
                    </div>
                  ))}
                </div>

                {/* Time Slots Rows */}
                <div className="divide-y divide-gray-100">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8 divide-x divide-gray-100">
                      <div className="p-2 text-xs font-medium text-gray-500 flex items-center justify-center bg-gray-50/50">
                        {time}
                      </div>
                      {weekDays.map((day, dayIdx) => {
                        const slotAppts = getAppointmentsForSlot(day, time)
                        return (
                          <div
                            key={dayIdx}
                            className={`p-1 min-h-[70px] transition-colors ${
                              isToday(day) ? 'bg-blue-50/20' : 'hover:bg-gray-50/30'
                            }`}
                          >
                            {slotAppts.map((apt) => (
                              <div
                                key={apt.id}
                                className={`text-[10px] p-1.5 rounded mb-1 border shadow-xs transition-shadow hover:shadow-sm ${
                                  apt.status === 'completed'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : apt.status === 'in_progress'
                                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    : apt.status === 'cancelled'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'
                                }`}
                                title={`${apt.patient.name} - ${apt.doctor.user.name}`}
                              >
                                <p className="font-semibold truncate">{apt.patient.name}</p>
                                <p className="text-gray-500 truncate mt-0.5">Dr. {apt.doctor.user.name}</p>
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-current/10">
                                  <span>Token #{apt.tokenNumber}</span>
                                  <span className="capitalize font-medium">{apt.status.replace('_', ' ')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
            <span className="font-semibold">Legend:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border bg-blue-50 border-blue-200"></span> Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border bg-yellow-50 border-yellow-200"></span> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border bg-green-50 border-green-200"></span> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border bg-red-50 border-red-200"></span> Cancelled
            </span>
          </div>
        </>
      )}
    </div>
  )
}
