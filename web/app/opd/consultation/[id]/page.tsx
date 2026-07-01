"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2, Thermometer, Activity, Heart, Weight, Ruler, FileText, Receipt, Plus, Trash2, IndianRupee, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { PrescriptionForm } from '@/components/prescription-form'

interface ServiceItem {
  id: string; name: string; category: string; price: number; description?: string; isActive: boolean
}

interface ChargeItem {
  description: string
  quantity: number
  unitPrice: number
  type: string
}

function ServiceAutocomplete({ value, onChange, onSelect, services }: {
  value: string; onChange: (v: string) => void; onSelect: (svc: ServiceItem) => void; services: ServiceItem[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.length > 0
    ? services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : services.slice(0, 8)

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={e => {
          if (justSelectedRef.current) { justSelectedRef.current = false; return }
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search services or enter custom..."
        className="h-9"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.map((s) => (
            <div key={s.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between text-sm"
              onMouseDown={() => { justSelectedRef.current = true; onSelect(s); setQuery(s.name); setOpen(false) }}>
              <span>{s.name}</span>
              <span className="text-gray-500">₹{s.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [createdInvoice, setCreatedInvoice] = useState<Record<string, unknown> | null>(null)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [serviceSearch, setServiceSearch] = useState('')

  const [vitals, setVitals] = useState({ temperature: '', bloodPressure: '', pulse: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '' })
  const [formData, setFormData] = useState({ chiefComplaint: '', symptoms: '', diagnosis: '', clinicalNotes: '' })
  const [extraCharges, setExtraCharges] = useState<ChargeItem[]>([])

  useEffect(() => { fetchAppointment(); fetchServices() }, [params.id])

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

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(Array.isArray(data) ? data : [])
      }
    } catch { /* Services optional */ }
  }

  const addCharge = () => {
    setExtraCharges([...extraCharges, { description: '', quantity: 1, unitPrice: 0, type: 'service' }])
  }

  const addServiceAsCharge = (svc: ServiceItem) => {
    setExtraCharges([...extraCharges, { description: svc.name, quantity: 1, unitPrice: svc.price, type: 'service' }])
    toast(`${svc.name} added to charges`, 'success')
  }

  const removeCharge = (index: number) => {
    setExtraCharges(extraCharges.filter((_, i) => i !== index))
  }

  const updateCharge = (index: number, field: keyof ChargeItem, value: string | number) => {
    const updated = [...extraCharges]
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index] = { ...updated[index], [field]: parseFloat(value as string) || 0 }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setExtraCharges(updated)
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const extraChargesTotal = extraCharges.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0)

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

      try {
        const billRes = await fetch('/api/invoices/auto-opd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId: cid,
            extraCharges: extraCharges.filter(c => c.description && c.unitPrice > 0),
          }),
        })
        if (billRes.ok) {
          const invoice = await billRes.json()
          setCreatedInvoice(invoice)
          toast(`Invoice ${invoice.invoiceNumber} created — ₹${invoice.total}`, 'success')
        } else {
          const err = await billRes.json().catch(() => ({}))
          toast(err.error || 'Could not auto-generate bill', 'error')
        }
      } catch {
        toast('Bill generation failed — create manually from Billing', 'error')
      }
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
  const consultationFee = services.find(s => {
    const n = s.name.toLowerCase()
    return n.includes('consultation') && (n.includes('fee') || n === 'consultation')
  })

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/opd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to OPD</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Consultation</h1>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}

      {/* Patient Info + Consultation Fee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
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

        {consultationFee && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Consultation Fee</p>
              <p className="text-2xl font-bold text-blue-800">₹{consultationFee.price.toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-1">Auto-added to invoice</p>
            </CardContent>
          </Card>
        )}
      </div>

      {createdInvoice && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Invoice Created: {createdInvoice.invoiceNumber as string}</p>
                  <p className="text-sm text-green-700">Total: ₹{(createdInvoice.total as number).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/billing/${createdInvoice.id as string}/payment`}>
                  <Button size="sm">Pay Now</Button>
                </Link>
                <Link href={`/billing/${createdInvoice.id as string}/receipt`}>
                  <Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" /> Receipt</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {prescriptionSaved && !createdInvoice && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">Prescription Saved</p>
                  <p className="text-sm text-yellow-700">Auto-bill could not be generated. Create invoice manually from Billing.</p>
                </div>
              </div>
              <Link href="/billing/new">
                <Button size="sm" variant="outline">Create Invoice</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Extra Charges */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5" /> Additional Charges</CardTitle>
            <Button type="button" size="sm" onClick={addCharge}><Plus className="mr-1 h-3 w-3" /> Add Charge</Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Service Catalog */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">All Services ({services.length})</span>
            </div>
            <Input placeholder="Search services..." value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} className="h-8 text-xs" />
            {filteredServices.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredServices.map(s => (
                  <button key={s.id} type="button" onClick={() => addServiceAsCharge(s)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 hover:bg-blue-100 hover:text-blue-700 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                    <span>{s.name}</span>
                    <span className="text-gray-400">₹{s.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Charge Rows */}
          {extraCharges.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Click a service above or "Add Charge" for custom entries.</p>
          ) : (
            <div className="space-y-3">
              {extraCharges.map((charge, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="text-xs font-medium">Service *</label>
                    <ServiceAutocomplete
                      value={charge.description}
                      onChange={v => updateCharge(i, 'description', v)}
                      onSelect={svc => {
                        const updated = [...extraCharges]
                        updated[i] = { description: svc.name, quantity: updated[i].quantity, unitPrice: svc.price, type: 'service' }
                        setExtraCharges(updated)
                      }}
                      services={services}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Qty</label>
                    <Input type="number" min="1" value={charge.quantity} onChange={e => updateCharge(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Rate (₹)</label>
                    <Input type="number" step="0.01" value={charge.unitPrice} onChange={e => updateCharge(i, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Amount</label>
                    <p className="font-medium h-10 flex items-center">₹{(charge.quantity * charge.unitPrice).toFixed(2)}</p>
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <p className="text-sm font-semibold">Extra Charges Total: ₹{extraChargesTotal.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescription */}
      <div className="mt-6">
        <PrescriptionForm onSave={handleSavePrescription} onCancel={() => router.push('/opd')} />
      </div>
    </div>
  )
}
