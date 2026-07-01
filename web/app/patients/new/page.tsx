"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, User, Phone, MapPin, Droplet, Loader2, Calendar, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientSchema } from '@/lib/validations'
import { useToast } from '@/components/ui/toast'

type FormData = {
  name: string; mobile: string; gender: string; dateOfBirth: string; age: string
  address: string; bloodGroup: string; emergencyContact: string; emergencyContactNumber: string
}

export default function NewPatientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredPatient, setRegisteredPatient] = useState<{ id: string; uhid: string } | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(patientSchema) as any,
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

  const onInvalid = (errs: any) => {
    const msgs = Object.values(errs).map((e: any) => e?.message).filter(Boolean)
    const msg = msgs.length ? msgs.join('. ') : 'Please fill all required fields'
    setError(msg)
    toast(msg, 'error')
  }

  const onSubmit = async (data: FormData, bookAppointment = false) => {
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
      toast(`Patient registered! UHID: ${patient.uhid}`, 'success')
      if (bookAppointment) {
        router.push(`/appointments/new?patientId=${patient.id}&uhid=${patient.uhid}&name=${encodeURIComponent(patient.name)}`)
      } else {
        router.push('/patients')
      }
    } catch (err: any) { setError(err.message); toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  const FieldError = ({ name }: { name: keyof FormData }) => {
    const err = errors[name]
    return err ? <p className="text-xs text-red-500 mt-1">{err.message}</p> : null
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/patients"><Button variant="ghost" className="mb-2 -ml-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">New Patient Registration</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the patient details below</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((data) => onSubmit(data, false), onInvalid)} className="space-y-6">
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md">{error}</div>}

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
              <Link href="/patients"><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} size="sm">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Register
                </Button>
                <Button type="button" disabled={loading} size="sm" variant="outline"
                  onClick={handleSubmit((data) => onSubmit(data, true), onInvalid)}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Register & Book Appointment
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
