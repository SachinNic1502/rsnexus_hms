"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Thermometer, Activity, Heart, Weight, Ruler, CheckCircle, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { PrescriptionForm } from '@/components/prescription-form'

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState<Record<string, unknown> | null>(null)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [prescriptionSaved, setPrescriptionSaved] = useState(false)
  const [consultationComplete, setConsultationComplete] = useState(false)

  const [vitals, setVitals] = useState({ temperature: '', bloodPressure: '', pulse: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '' })
  const [formData, setFormData] = useState({ chiefComplaint: '', symptoms: '', diagnosis: '', clinicalNotes: '' })

  useEffect(() => { fetchAppointment() }, [params.id])

  const apt = appointment as Record<string, unknown> | null

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`)
      if (!res.ok) throw new Error('Appointment not found')
      const a = await res.json()
      setAppointment(a)
      if (a.status !== 'in_progress') {
        await fetch(`/api/appointments/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        })
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setLoading(false) }
  }

  const handleSaveConsultation = async () => {
    setSaving(true)
    setError('')
    try {
      const aptData = appointment as Record<string, unknown>
      const patient = aptData.patient as Record<string, unknown>
      const doctor = aptData.doctor as Record<string, unknown>
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: aptData.id,
          patientId: patient.id,
          doctorId: doctor.id,
          ...formData,
          ...vitals,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save consultation')
      }
      const cons = await res.json()
      setConsultationId(cons.id)
      return cons.id
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrescription = async (medicines: unknown[]) => {
    let cid = consultationId
    if (!cid) {
      cid = await handleSaveConsultation()
      if (!cid) return
    }
    setSaving(true)
    try {
      const aptData = appointment as Record<string, unknown>
      const patient = aptData.patient as Record<string, unknown>
      const doctor = aptData.doctor as Record<string, unknown>
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: cid,
          patientId: patient.id,
          doctorId: doctor.id,
          medicines,
        }),
      })
      if (!res.ok) throw new Error('Failed to save prescription')
      setPrescriptionSaved(true)

      await fetch(`/api/appointments/${aptData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      setConsultationComplete(true)
      toast('Consultation completed successfully!', 'success')
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (error && !appointment) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!appointment) return <div className="p-8 text-center">Appointment not found</div>

  const patient = apt!.patient as Record<string, unknown>
  const department = apt!.department as Record<string, unknown>
  const doctor = apt!.doctor as Record<string, unknown>
  const doctorUser = doctor?.user as Record<string, unknown> | undefined

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/opd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to OPD</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Consultation</h1>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}

      {/* Success Message */}
      {consultationComplete && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Consultation Completed!</h3>
                <p className="text-green-700">Patient consultation has been saved successfully. The receptionist can now proceed with billing.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/opd">
                <Button variant="outline" size="sm">Back to OPD</Button>
              </Link>
              <Link href={`/patients/${patient.id as string}`}>
                <Button size="sm">View Patient Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg">#{apt!.tokenNumber as number}</Badge>
              <div>
                <h3 className="font-semibold text-lg">{patient.name as string}</h3>
                <p className="text-sm text-gray-600">{patient.uhid as string} | {department.name as string}</p>
                <p className="text-sm text-gray-500">Dr. {doctorUser?.name as string}</p>
              </div>
            </div>
            <Badge variant={prescriptionSaved ? 'success' : 'warning'}>{prescriptionSaved ? 'completed' : (apt!.status as string).replace('_', ' ')}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitals */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Vitals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temp (°F)</label><Input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} placeholder="98.6" /></div>
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Heart className="h-3 w-3" /> Blood Pressure</label><Input value={vitals.bloodPressure} onChange={e => setVitals({ ...vitals, bloodPressure: e.target.value })} placeholder="120/80" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Pulse (bpm)</label><Input type="number" value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} placeholder="72" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Resp Rate</label><Input type="number" value={vitals.respiratoryRate} onChange={e => setVitals({ ...vitals, respiratoryRate: e.target.value })} placeholder="16" /></div>
              <div className="space-y-1"><label className="text-sm font-medium">SpO2 (%)</label><Input type="number" value={vitals.oxygenSaturation} onChange={e => setVitals({ ...vitals, oxygenSaturation: e.target.value })} placeholder="98" /></div>
              <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Weight className="h-3 w-3" /> Weight (kg)</label><Input type="number" step="0.1" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} placeholder="70" /></div>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium flex items-center gap-1"><Ruler className="h-3 w-3" /> Height (cm)</label><Input type="number" value={vitals.height} onChange={e => setVitals({ ...vitals, height: e.target.value })} placeholder="170" /></div>
          </CardContent>
        </Card>

        {/* Clinical */}
        <Card>
          <CardHeader><CardTitle>Clinical Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><label className="text-sm font-medium">Chief Complaint *</label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.chiefComplaint} onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })} placeholder="Primary reason for visit" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Symptoms</label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} placeholder="List of symptoms" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Diagnosis *</label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} placeholder="Diagnosis" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Clinical Notes</label><textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={formData.clinicalNotes} onChange={e => setFormData({ ...formData, clinicalNotes: e.target.value })} placeholder="Additional notes" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Prescription */}
      <div className="mt-6">
        <PrescriptionForm onSave={handleSavePrescription} onCancel={() => router.push('/opd')} />
      </div>
    </div>
  )
}
