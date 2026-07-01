"use client"

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Calendar, Clock, User, Stethoscope, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface AppointmentData {
  id: string
  appointmentNumber: string
  tokenNumber: number
  date: string
  time: string
  consultationType: string
  status: string
  patient: { id: string; name: string; uhid: string; mobile: string }
  doctor: { id: string; user: { name: string }; specialization: string; departmentId: string }
  department: { id: string; name: string }
}

interface Department { id: string; name: string }
interface Doctor { id: string; user: { name: string }; specialization: string; departmentId: string; available: boolean }

function EditAppointmentForm() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState<AppointmentData | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])

  const [formData, setFormData] = useState({
    departmentId: '',
    doctorId: '',
    date: '',
    time: '',
    consultationType: 'new',
  })

  useEffect(() => {
    fetchAppointment()
    fetchDepartments()
  }, [params.id])

  useEffect(() => {
    if (formData.departmentId) {
      fetchDoctors(formData.departmentId)
    } else {
      setDoctors([])
    }
  }, [formData.departmentId])

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`)
      if (!res.ok) throw new Error('Appointment not found')
      const apt = await res.json()
      setAppointment(apt)
      setFormData({
        departmentId: apt.department.id,
        doctorId: apt.doctor.id,
        date: apt.date.split('T')[0],
        time: apt.time,
        consultationType: apt.consultationType,
      })
    } catch (err) {
      setError('Failed to load appointment')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      if (res.ok) {
        const data = await res.json()
        setDepartments(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }

  const fetchDoctors = async (deptId: string) => {
    try {
      const res = await fetch(`/api/doctors?departmentId=${deptId}`)
      if (res.ok) {
        const data = await res.json()
        setDoctors(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update appointment')
      }
      toast('Appointment updated successfully', 'success')
      router.push('/appointments')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update appointment'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'departmentId') {
        updated.doctorId = ''
      }
      return updated
    })
  }

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ]

  const isFormValid = formData.departmentId && formData.doctorId && formData.date && formData.time

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Appointment not found</p>
        <Link href="/appointments"><Button className="mt-4" variant="outline">Back to Appointments</Button></Link>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/appointments">
          <Button variant="ghost" className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Appointment</h1>
        <p className="text-sm text-gray-500 mt-1">
          {appointment.appointmentNumber} &middot; Token #{appointment.tokenNumber}
        </p>
      </div>

      {/* Patient Info (Read-only) */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{appointment.patient.name}</p>
              <p className="text-sm text-gray-500">{appointment.patient.uhid} &middot; {appointment.patient.mobile}</p>
            </div>
            <Badge variant="outline" className="ml-auto">{appointment.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Department & Doctor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Department & Doctor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Doctor *</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  disabled={!formData.departmentId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="">{formData.departmentId ? 'Select Doctor' : 'Select department first'}</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user.name} ({d.specialization}){!d.available ? ' - Unavailable' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Date *</label>
              <Input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Time Slot *
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {timeSlots.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, time: s }))}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                      formData.time === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consultation Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Consultation Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[{ value: 'new', label: 'New', desc: 'First visit' }, { value: 'follow_up', label: 'Follow-up', desc: 'Previous patient' }].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, consultationType: opt.value }))}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    formData.consultationType === opt.value
                      ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          <Link href="/appointments">
            <Button type="button" variant="outline" size="sm">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving || !isFormValid} size="sm">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Update Appointment
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function EditAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <EditAppointmentForm />
    </Suspense>
  )
}
