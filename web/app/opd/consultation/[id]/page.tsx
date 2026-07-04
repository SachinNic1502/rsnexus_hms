"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Thermometer, Activity, Heart, Weight, Ruler } from 'lucide-react'
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
  const [medicineOptions, setMedicineOptions] = useState<{ id: string; name: string }[]>([])

  const [formData, setFormData] = useState({ chiefComplaint: '', symptoms: '', diagnosis: '', clinicalNotes: '' })

  useEffect(() => { fetchAppointment(); fetchMedicines() }, [params.id])

  const apt = appointment as Record<string, unknown> | null

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${params.id}`)
      if (!res.ok) throw new Error('Appointment not found')
      const a = await res.json()
      setAppointment(a)

      const existingConsultation = a.consultation as Record<string, unknown> | null
      if (existingConsultation) {
        setConsultationId(existingConsultation.id as string)
        setFormData({
          chiefComplaint: (existingConsultation.chiefComplaint as string) || '',
          symptoms: (existingConsultation.symptoms as string) || '',
          diagnosis: (existingConsultation.diagnosis as string) || '',
          clinicalNotes: (existingConsultation.clinicalNotes as string) || '',
        })
      }

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

  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicines')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setMedicineOptions(data.map((m: any) => ({ id: m.id, name: m.name })))
      }
    } catch { /* Medicine master list is optional; manual entry still works */ }
  }

  const handleSaveConsultation = async () => {
    setSaving(true)
    setError('')
    try {
      const aptData = appointment as Record<string, unknown>
      const patient = aptData.patient as Record<string, unknown>
      const doctor = aptData.doctor as Record<string, unknown>

      if (consultationId) {
        const res = await fetch(`/api/consultations/${consultationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to save consultation')
        return consultationId
      }

      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: aptData.id,
          patientId: patient.id,
          doctorId: doctor.id,
          ...formData,
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
    const cid = await handleSaveConsultation()
    if (!cid) return
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

      await fetch(`/api/appointments/${aptData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })

      toast('Consultation completed and prescription saved', 'success')
      router.push(`/patients/${patient.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
      toast(err instanceof Error ? err.message : 'Failed to complete consultation', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (error && !appointment) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!appointment) return <div className="p-8 text-center">Appointment not found</div>

  const patient = apt!.patient as Record<string, unknown>
  const department = apt!.department as Record<string, unknown>
  const doctor = apt!.doctor as Record<string, unknown>
  const doctorUser = doctor?.user as Record<string, unknown> | undefined
  const consultation = apt!.consultation as Record<string, unknown> | null

  const vitalsEntries: { label: string; value: unknown; icon: any }[] = consultation ? [
    { label: 'Blood Pressure', value: consultation.bloodPressure, icon: Heart },
    { label: 'SpO2', value: consultation.oxygenSaturation ? `${consultation.oxygenSaturation}%` : null, icon: Activity },
    { label: 'Temperature', value: consultation.temperature ? `${consultation.temperature}°F` : null, icon: Thermometer },
    { label: 'Pulse', value: consultation.pulse ? `${consultation.pulse} bpm` : null, icon: Activity },
    { label: 'Height', value: consultation.height ? `${consultation.height} cm` : null, icon: Ruler },
    { label: 'Weight', value: consultation.weight ? `${consultation.weight} kg` : null, icon: Weight },
  ].filter(v => v.value) : []

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/opd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to OPD</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Consultation</h1>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}

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
            <Badge variant="warning">{(apt!.status as string).replace('_', ' ')}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vitals (read-only, captured by reception) */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Vitals</CardTitle></CardHeader>
          <CardContent>
            {vitalsEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No vitals recorded by reception yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {vitalsEntries.map(v => (
                  <div key={v.label} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3 space-y-1">
                    <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><v.icon className="h-3.5 w-3.5" /> {v.label}</p>
                    <p className="text-lg font-semibold text-gray-900">{v.value as string}</p>
                  </div>
                ))}
              </div>
            )}
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
        <PrescriptionForm onSave={handleSavePrescription} onCancel={() => router.push(`/patients/${patient.id as string}`)} medicineOptions={medicineOptions} />
      </div>
    </div>
  )
}
