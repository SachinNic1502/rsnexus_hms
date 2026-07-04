"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Save, User, Phone, MapPin, Droplet, Calendar, Stethoscope,
  Loader2, Search, Activity, Heart, Thermometer, Weight, Ruler, Clock,
  CheckCircle, AlertCircle, ChevronRight, ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema, appointmentSchema } from '@/lib/validations'
import { useToast } from '@/components/ui/toast'

type Step = 'search' | 'register' | 'vitals' | 'appointment' | 'confirm'

type PatientFormData = {
  name: string; mobile: string; gender: string; dateOfBirth: string; age: string
  address: string; bloodGroup: string; emergencyContact: string; emergencyContactNumber: string
}

type AppointmentFormData = {
  departmentId: string; doctorId: string; date: string; time: string; consultationType: string
  temperature: string; bloodPressure: string; pulse: string; oxygenSaturation: string; weight: string; height: string
}

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

export default function RegistrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState<Step>('search')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Patient search state
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [searchingPatients, setSearchingPatients] = useState(false)

  // Patient registration state
  const [registeredPatient, setRegisteredPatient] = useState<any>(null)

  // Vitals state
  const [vitals, setVitals] = useState({
    temperature: '', bloodPressure: '', pulse: '', oxygenSaturation: '', weight: '', height: ''
  })

  // Appointment state
  const [departments, setDepartments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [appointmentData, setAppointmentData] = useState({
    departmentId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '', consultationType: 'new'
  })

  // Patient registration form
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema) as unknown as Resolver<PatientFormData>,
    defaultValues: { name: '', mobile: '', gender: '', dateOfBirth: '', age: '', address: '', bloodGroup: '', emergencyContact: '', emergencyContactNumber: '' },
  })

  const watchDob = watch('dateOfBirth')

  useEffect(() => {
    if (watchDob) {
      const dob = new Date(watchDob)
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const m = today.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
      if (age >= 0 && age <= 150) setValue('age', String(age))
    }
  }, [watchDob, setValue])

  useEffect(() => {
    safeFetchJson('/api/departments').then(setDepartments)
  }, [])

  useEffect(() => {
    if (appointmentData.departmentId) {
      safeFetchJson(`/api/doctors?departmentId=${appointmentData.departmentId}`).then(setDoctors)
      setAppointmentData(prev => ({ ...prev, doctorId: '' }))
    } else {
      setDoctors([])
    }
  }, [appointmentData.departmentId])

  useEffect(() => {
    if (patientSearch.length < 2 || selectedPatient) {
      setPatientResults([])
      return
    }
    setSearchingPatients(true)
    const timeout = setTimeout(async () => {
      try {
        const results = await safeFetchJson(`/api/patients?search=${encodeURIComponent(patientSearch)}&searchType=all`)
        setPatientResults(results.slice(0, 10))
      } catch {
        setPatientResults([])
      } finally {
        setSearchingPatients(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientSearch, selectedPatient])

  const selectPatient = (p: any) => {
    setSelectedPatient(p)
    setPatientSearch(`${p.name} (${p.uhid})`)
    setPatientResults([])
    setCurrentStep('vitals')
  }

  const clearPatient = () => {
    setSelectedPatient(null)
    setPatientSearch('')
    setPatientResults([])
    setCurrentStep('search')
  }

  const onPatientSubmit = async (data: PatientFormData) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, bloodGroup: data.bloodGroup || null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to register patient') }
      const patient = await res.json()
      setRegisteredPatient(patient)
      setSelectedPatient(patient)
      toast(`Patient registered! UHID: ${patient.uhid}`, 'success')
      setCurrentStep('vitals')
    } catch (err: any) { setError(err.message); toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  const handleVitalsNext = () => {
    setCurrentStep('appointment')
  }

  const handleAppointmentSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const patient = selectedPatient || registeredPatient
      if (!patient) throw new Error('No patient selected')

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          ...appointmentData,
          ...vitals,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to book appointment')
      }
      const apt = await res.json()
      toast(`Appointment booked! Token: #${apt.tokenNumber}`, 'success')
      setCurrentStep('confirm')
    } catch (err: any) {
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ]

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'search', label: 'Find Patient', icon: Search },
    { key: 'register', label: 'Register', icon: User },
    { key: 'vitals', label: 'Vitals', icon: Activity },
    { key: 'appointment', label: 'Appointment', icon: Calendar },
    { key: 'confirm', label: 'Confirm', icon: CheckCircle },
  ]

  const getStepIndex = (step: Step) => steps.findIndex(s => s.key === step)
  const currentStepIndex = getStepIndex(currentStep)

  const FieldError = ({ name }: { name: keyof PatientFormData }) => {
    const err = errors[name]
    return err ? <p className="text-xs text-red-500 mt-1">{err.message}</p> : null
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard"><Button variant="ghost" className="mb-2 -ml-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">Patient Registration & Appointment</h1>
        <p className="text-sm text-gray-500 mt-1">Register new patient or book appointment for existing patient</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.key
            const isCompleted = currentStepIndex > index
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-100 text-blue-700' :
                  isCompleted ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium hidden md:inline">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-1" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Step 1: Search Patient */}
      {currentStep === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Find Existing Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchRef}
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
                placeholder="Search by Name, Mobile, or Patient ID..."
                className="pl-10"
                autoFocus
              />
              {searchingPatients && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
            </div>

            {patientResults.length > 0 && (
              <div className="border rounded-md shadow-sm max-h-64 overflow-auto divide-y">
                {patientResults.map((p: any) => (
                  <div key={p.id} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => selectPatient(p)}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm text-gray-500 font-mono">{p.uhid}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{p.mobile} · {p.gender} · Age {p.age || '-'}</div>
                  </div>
                ))}
              </div>
            )}

            {patientSearch.length >= 2 && !searchingPatients && patientResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No patients found</p>
                <Button onClick={() => setCurrentStep('register')}>
                  <User className="mr-2 h-4 w-4" /> Register New Patient
                </Button>
              </div>
            )}

            {patientSearch.length < 2 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Type at least 2 characters to search</p>
                <Button onClick={() => setCurrentStep('register')} variant="outline">
                  <User className="mr-2 h-4 w-4" /> Register New Patient Instead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Register New Patient */}
      {currentStep === 'register' && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onPatientSubmit)} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Full Name *</label>
                    <Input {...register('name')} placeholder="Patient's full name" />
                    <FieldError name="name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mobile Number *</label>
                    <Input {...register('mobile')} type="tel" placeholder="10-digit mobile" maxLength={10} />
                    <FieldError name="mobile" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Gender *</label>
                    <select {...register('gender')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <FieldError name="gender" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" /> Date of Birth & Blood Group</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input {...register('dateOfBirth')} type="date" max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Age (auto-calculated)</label>
                    <Input {...register('age')} type="number" placeholder="Age" min="0" max="150" readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-1"><Droplet className="h-3 w-3" /> Blood Group</label>
                    <select {...register('bloodGroup')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select</option>
                      <option value="A_positive">A+</option><option value="A_negative">A-</option>
                      <option value="B_positive">B+</option><option value="B_negative">B-</option>
                      <option value="AB_positive">AB+</option><option value="AB_negative">AB-</option>
                      <option value="O_positive">O+</option><option value="O_negative">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</h3>
                <textarea {...register('address')} rows={2} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Full address" />
                <FieldError name="address" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2"><Phone className="h-4 w-4" /> Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Person</label>
                    <Input {...register('emergencyContact')} placeholder="Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Contact Number</label>
                    <Input {...register('emergencyContactNumber')} type="tel" placeholder="10-digit number" maxLength={10} />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button type="button" variant="outline" onClick={clearPatient}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Register & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Vitals */}
      {currentStep === 'vitals' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Record Vitals
              {selectedPatient && (
                <Badge variant="outline" className="ml-2">{selectedPatient.name}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature (°F)</label>
                  <Input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} placeholder="98.6" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><Heart className="h-3 w-3" /> Blood Pressure</label>
                  <Input value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} placeholder="120/80" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Pulse (bpm)</label>
                  <Input type="number" value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} placeholder="72" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">SpO2 (%)</label>
                  <Input type="number" value={vitals.oxygenSaturation} onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })} placeholder="98" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><Weight className="h-3 w-3" /> Weight (kg)</label>
                  <Input type="number" step="0.1" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} placeholder="70" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-1"><Ruler className="h-3 w-3" /> Height (cm)</label>
                  <Input type="number" value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} placeholder="170" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setCurrentStep(selectedPatient ? 'search' : 'register')}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={handleVitalsNext}>
                Continue to Appointment <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Appointment */}
      {currentStep === 'appointment' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Department & Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Department *</label>
                  <select
                    value={appointmentData.departmentId}
                    onChange={e => setAppointmentData({ ...appointmentData, departmentId: e.target.value })}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Doctor *</label>
                  <select
                    value={appointmentData.doctorId}
                    onChange={e => setAppointmentData({ ...appointmentData, doctorId: e.target.value })}
                    required
                    disabled={!appointmentData.departmentId}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">{appointmentData.departmentId ? 'Select Doctor' : 'Select department first'}</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.user.name} ({d.specialization})</option>)}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={appointmentData.date}
                  onChange={e => setAppointmentData({ ...appointmentData, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Time Slot *</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {timeSlots.map(s => (
                    <button key={s} type="button" onClick={() => setAppointmentData({ ...appointmentData, time: s })}
                      className={`px-2 py-1.5 text-xs rounded-md border transition-all ${appointmentData.time === s ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Consultation Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[{ value: 'new', label: 'New', desc: 'First visit' }, { value: 'follow_up', label: 'Follow-up', desc: 'Previous patient' }].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setAppointmentData({ ...appointmentData, consultationType: opt.value })}
                    className={`flex-1 p-3 rounded-lg border text-left transition-all ${appointmentData.consultationType === opt.value ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-2">
            <Button type="button" variant="outline" onClick={() => setCurrentStep('vitals')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              type="button"
              onClick={handleAppointmentSubmit}
              disabled={loading || !appointmentData.departmentId || !appointmentData.doctorId || !appointmentData.date || !appointmentData.time}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {currentStep === 'confirm' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
              <p className="text-gray-600 mb-6">Patient has been registered and appointment booked successfully.</p>

              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Patient:</div>
                  <div className="font-medium">{selectedPatient?.name}</div>
                  <div className="text-gray-600">UHID:</div>
                  <div className="font-medium">{selectedPatient?.uhid}</div>
                  {appointmentData.time && (
                    <>
                      <div className="text-gray-600">Time:</div>
                      <div className="font-medium">{appointmentData.time}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => {
                  setCurrentStep('search')
                  setSelectedPatient(null)
                  setPatientSearch('')
                  setVitals({ temperature: '', bloodPressure: '', pulse: '', oxygenSaturation: '', weight: '', height: '' })
                  setAppointmentData({ departmentId: '', doctorId: '', date: new Date().toISOString().split('T')[0], time: '', consultationType: 'new' })
                }}>
                  Register Another Patient
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
