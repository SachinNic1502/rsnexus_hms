"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Calendar, Clock, User, Stethoscope, Loader2, Search, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

async function safeFetchJson(url: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function NewAppointmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patientId, setPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [searchingPatients, setSearchingPatients] = useState(false)

  const [formData, setFormData] = useState({
    departmentId: searchParams.get('departmentId') || '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    consultationType: 'new',
  })

  useEffect(() => {
    safeFetchJson('/api/departments').then(setDepartments)
  }, [])

  useEffect(() => {
    if (formData.departmentId) {
      safeFetchJson(`/api/doctors?departmentId=${formData.departmentId}`).then(setDoctors)
      setFormData(prev => ({ ...prev, doctorId: '' }))
    } else {
      setDoctors([])
    }
  }, [formData.departmentId])

  useEffect(() => {
    const pid = searchParams.get('patientId')
    const uhid = searchParams.get('uhid')
    const name = searchParams.get('name')
    if (pid && uhid) {
      setPatientId(pid)
      setSelectedPatient({ id: pid, uhid, name: name || '' })
      setPatientSearch(uhid)
    }
  }, [searchParams])

  const selectedPatientId = selectedPatient?.id ?? null

  useEffect(() => {
    if (patientSearch.length < 2 || selectedPatientId) {
      setPatientResults([])
      return
    }
    setSearchingPatients(true)
    const timeout = setTimeout(async () => {
      try {
        const [uhidResults, mobileResults] = await Promise.all([
          safeFetchJson(`/api/patients?search=${patientSearch}&searchType=uhid`),
          safeFetchJson(`/api/patients?search=${patientSearch}&searchType=mobile`),
        ])
        const merged = [...uhidResults]
        mobileResults.forEach((p: any) => {
          if (!merged.find((m: any) => m.id === p.id)) merged.push(p)
        })
        setPatientResults(merged.slice(0, 10))
      } catch {
        setPatientResults([])
      } finally {
        setSearchingPatients(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientSearch, selectedPatientId])

  const selectPatient = (p: any) => {
    setSelectedPatient(p)
    setPatientId(p.id)
    setPatientSearch(p.uhid)
    setPatientResults([])
  }

  const clearPatient = () => {
    setSelectedPatient(null)
    setPatientId('')
    setPatientSearch('')
    setPatientResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, ...formData }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to book appointment')
      }
      const apt = await res.json()
      toast(`Appointment booked! Token: #${apt.tokenNumber}`, 'success')
      router.push('/appointments')
    } catch (err: any) {
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ]

  const isFormValid = selectedPatient && formData.departmentId && formData.doctorId && formData.date && formData.time

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/appointments"><Button variant="ghost" className="mb-2 -ml-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-sm text-gray-500 mt-1">Search patient and select doctor & time slot</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2"><User className="h-4 w-4" /> Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input ref={searchRef} value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
                    placeholder="Search by UHID or mobile number..." className="pl-10" autoFocus />
                  {searchingPatients && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                </div>
                {patientResults.length > 0 && (
                  <div className="border rounded-md shadow-sm max-h-52 overflow-auto divide-y">
                    {patientResults.map((p: any) => (
                      <div key={p.id} className="p-3 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => selectPatient(p)}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{p.name}</span>
                          <span className="text-xs text-gray-500 font-mono">{p.uhid}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.mobile} &middot; {p.gender} &middot; Age {p.age || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
                {patientSearch.length >= 2 && !searchingPatients && patientResults.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No patients found. <Link href="/patients/new" className="text-blue-600 hover:underline font-medium">Register new patient</Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                <div>
                  <p className="font-medium text-sm">{selectedPatient.name}</p>
                  <p className="text-xs text-gray-600">{selectedPatient.uhid} &middot; {selectedPatient.mobile || ''}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearPatient} className="text-gray-500 hover:text-red-600">Change</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Department & Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select Department</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Doctor *</label>
                <select name="doctorId" value={formData.doctorId} onChange={handleChange} required disabled={!formData.departmentId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                  <option value="">{formData.departmentId ? 'Select Doctor' : 'Select department first'}</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.user.name} ({d.specialization})</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2"><Calendar className="h-4 w-4" /> Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Date *</label>
              <Input name="date" type="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Time Slot *</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {timeSlots.map(s => (
                  <button key={s} type="button" onClick={() => setFormData(prev => ({ ...prev, time: s }))}
                    className={`px-2 py-1.5 text-xs rounded-md border transition-all ${formData.time === s ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Consultation Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {[{ value: 'new', label: 'New', desc: 'First visit' }, { value: 'follow_up', label: 'Follow-up', desc: 'Previous patient' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => setFormData(prev => ({ ...prev, consultationType: opt.value }))}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${formData.consultationType === opt.value ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          <Link href="/appointments"><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
          <Button type="submit" disabled={loading || !isFormValid} size="sm">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Book Appointment
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <NewAppointmentForm />
    </Suspense>
  )
}
