"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Thermometer, Activity, Heart, Weight, Ruler, CheckCircle, DoorOpen, BedDouble, Plus } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { PrescriptionForm, type Medicine, type CurrentMedicineInput } from '@/components/prescription-form'
import { Dialog } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const isReadOnly = user?.role === 'nurse'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState<Record<string, unknown> | null>(null)
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [medicineOptions, setMedicineOptions] = useState<{ id: string; name: string }[]>([])
  // Prescription-entry state, lifted up from PrescriptionForm so the "Add to
  // Prescription" action can be triggered from the page header.
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [currentMedicine, setCurrentMedicine] = useState<CurrentMedicineInput>({ name: '', dose: '', instructions: '' })
  // Finish Consultation modal (Phase 4): doctor explicitly chooses the
  // patient's disposition — Discharge Today (OPD) or Admit Patient (IPD).
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishing, setFinishing] = useState(false)
  // When Admit Patient is chosen, the modal shows a second step asking for
  // the expected admission duration before routing to the Admissions flow.
  const [finishStep, setFinishStep] = useState<'choose' | 'admitDays'>('choose')
  const [admitDays, setAdmitDays] = useState('')

  const [formData, setFormData] = useState({ chiefComplaint: '', symptoms: '', diagnosis: '', clinicalNotes: '' })

  useEffect(() => { fetchAppointment(); fetchMedicines() }, [params.id])

  useEffect(() => {
    if (authLoading) return
    if (user?.role === 'super_admin') {
      toast('You do not have permission to access consultations', 'error')
      router.push('/opd')
    }
  }, [authLoading, user, router, toast])

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

      if (a.status !== 'in_progress' && user?.role !== 'nurse') {
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

  // Mark the appointment completed. Kept as a small helper so it stays in one
  // place for the Finish Consultation flow below.
  const markAppointmentCompleted = async () => {
    const aptData = appointment as Record<string, unknown>
    await fetch(`/api/appointments/${aptData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
  }

  // Medicine-entry handlers — moved up from PrescriptionForm so the primary
  // "Add to Prescription" action can be triggered from the page header.
  const addMedicine = () => {
    if (!currentMedicine.name || !currentMedicine.dose) {
      toast('Please enter medicine name and dose', 'error')
      return
    }
    setMedicines(prev => [...prev, { id: Date.now().toString(), ...currentMedicine }])
    setCurrentMedicine({ name: '', dose: '', instructions: '' })
  }

  const quickAddMedicine = (name: string) => {
    setMedicines(prev => [...prev, { id: `${Date.now()}-${name}`, name, dose: '', instructions: '' }])
  }

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id))
  }

  const updateMedicineDose = (id: string, dose: string) => {
    setMedicines(prev => prev.map(m => (m.id === id ? { ...m, dose } : m)))
  }

  // Finish Consultation — does everything the old standalone "Save
  // Prescription" button used to do (save the consultation, save any added
  // medicines as a prescription), plus marks the appointment completed and
  // opens the Discharge Today / Admit Patient modal. A prescription is
  // optional: finishing works even with zero medicines added.
  const handleFinishConsultation = async () => {
    if (!formData.chiefComplaint.trim()) {
      toast('Please enter the chief complaint before finishing', 'error')
      return
    }
    const cid = await handleSaveConsultation()
    if (!cid) return
    setSaving(true)
    try {
      if (medicines.length > 0) {
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
      }

      await markAppointmentCompleted()
      setFinishStep('choose')
      setShowFinishModal(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
      toast(err instanceof Error ? err.message : 'Failed to finish consultation', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Discharge Today (OPD): consultation is already completed. Generate the OPD
  // invoice (status Pending) via the existing auto-opd API and move the patient
  // to the billing queue. auto-opd is idempotent per visit (dedup guard).
  const handleDischargeToday = async () => {
    const aptData = appointment as Record<string, unknown>
    const patient = aptData.patient as Record<string, unknown>
    setFinishing(true)
    try {
      let invoiceMsg = ''
      if (consultationId) {
        const res = await fetch('/api/invoices/auto-opd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consultationId }),
        })
        if (res.ok) {
          const inv = await res.json()
          invoiceMsg = ` Invoice ${inv.invoiceNumber} created (Pending).`
        } else {
          const data = await res.json().catch(() => ({}))
          // Not fatal: the visit is still completed. The bill can be raised
          // later from the patient profile / billing module.
          invoiceMsg = data?.error ? ` No invoice generated: ${data.error}.` : ' No invoice generated.'
        }
      }
      toast(`Patient discharged (OPD).${invoiceMsg} Sent to billing queue.`, 'success')
      setShowFinishModal(false)
      router.push(`/patients/${patient.id}`)
    } catch {
      toast('Failed to complete OPD discharge', 'error')
    } finally {
      setFinishing(false)
    }
  }

  // Admit Patient (IPD): route to the existing Admissions flow, carrying the
  // patient / appointment / consultation / doctor context — plus the expected
  // admission duration entered on the modal's second step — so the admission
  // can be linked back (discharge later completes this consultation).
  const handleAdmitPatient = () => {
    const aptData = appointment as Record<string, unknown>
    const patient = aptData.patient as Record<string, unknown>
    const doctor = aptData.doctor as Record<string, unknown>
    const q = new URLSearchParams({
      patientId: String(patient.id),
      // Carried along so the Admit form can show the selected patient
      // immediately without a fresh lookup — the admitting doctor (chosen via
      // the form's own Attending Doctor dropdown) isn't necessarily the
      // currently logged-in session, so a lookup scoped to "my own patients"
      // would otherwise come back empty here.
      patientName: String(patient.name),
      patientUhid: String(patient.uhid),
      appointmentId: String(aptData.id),
      doctorId: String(doctor.id),
    })
    if (consultationId) q.set('consultationId', consultationId)
    if (admitDays) q.set('expectedStayDays', admitDays)
    setShowFinishModal(false)
    setFinishStep('choose')
    router.push(`/ipd/admit?${q.toString()}`)
  }

  if (authLoading || user?.role === 'super_admin') return null
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Consultation</h1>
          {!isReadOnly && (
            <Button onClick={addMedicine}>
              <Plus className="mr-2 h-4 w-4" /> Add to Prescription
            </Button>
          )}
        </div>
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
            <div className="space-y-1"><label className="text-sm font-medium">Chief Complaint *</label><textarea readOnly={isReadOnly} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.chiefComplaint} onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })} placeholder="Primary reason for visit" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Symptoms</label><textarea readOnly={isReadOnly} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} placeholder="List of symptoms" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Diagnosis *</label><textarea readOnly={isReadOnly} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={formData.diagnosis} onChange={e => setFormData({ ...formData, diagnosis: e.target.value })} placeholder="Diagnosis" /></div>
            <div className="space-y-1"><label className="text-sm font-medium">Clinical Notes</label><textarea readOnly={isReadOnly} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={formData.clinicalNotes} onChange={e => setFormData({ ...formData, clinicalNotes: e.target.value })} placeholder="Additional notes" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Prescription */}
      <div className="mt-6">
        <PrescriptionForm
          medicines={medicines}
          currentMedicine={currentMedicine}
          onCurrentMedicineChange={setCurrentMedicine}
          onQuickAddMedicine={quickAddMedicine}
          onRemoveMedicine={removeMedicine}
          onUpdateMedicineDose={updateMedicineDose}
          medicineOptions={medicineOptions}
          readOnly={isReadOnly}
        />
      </div>

      {/* Cancel + Finish Consultation — single aligned row. Cancel is always
          available (as before); Finish Consultation is limited to consulting
          roles (not read-only nurses). */}
      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push(`/patients/${patient.id as string}`)}>
          Cancel
        </Button>
        {!isReadOnly && (
          <Button onClick={handleFinishConsultation} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Finish Consultation
          </Button>
        )}
      </div>

      <Dialog
        open={showFinishModal}
        onClose={() => { setShowFinishModal(false); setFinishStep('choose') }}
        title={finishStep === 'admitDays' ? 'Admit Patient (IPD)' : 'Finish Consultation'}
      >
        {finishStep === 'choose' ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              How would you like to proceed with <span className="font-medium">{patient.name as string}</span>?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleDischargeToday}
                disabled={finishing}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
              >
                <div className="rounded-full bg-green-100 p-2"><DoorOpen className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="font-semibold">Discharge Today (OPD)</p>
                  <p className="text-sm text-gray-600">Complete the visit as outpatient and generate the OPD bill (status Pending). Patient moves to the billing queue.</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFinishStep('admitDays')}
                disabled={finishing}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
              >
                <div className="rounded-full bg-blue-100 p-2"><BedDouble className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="font-semibold">Admit Patient (IPD)</p>
                  <p className="text-sm text-gray-600">Admit as an inpatient, set the expected stay, and manage progress via Daily Rounds until discharge.</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              How many days is <span className="font-medium">{patient.name as string}</span> expected to stay admitted? This is an estimate only — the patient stays admitted until you explicitly discharge them.
            </p>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium">Expected Admission Duration (days)</label>
              <input
                type="number"
                min={1}
                autoFocus
                value={admitDays}
                onChange={e => setAdmitDays(e.target.value)}
                placeholder="e.g. 3"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFinishStep('choose')}>
                Back
              </Button>
              <Button type="button" onClick={handleAdmitPatient}>
                Continue to Admission
              </Button>
            </div>
          </>
        )}
        {finishing && (
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
          </div>
        )}
      </Dialog>
    </div>
  )
}
