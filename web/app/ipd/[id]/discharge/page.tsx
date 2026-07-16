"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dischargeSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, FileText, Calendar, AlertTriangle, Plus, Trash2, IndianRupee, Receipt, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

type DischargeForm = { dischargeSummary: string; finalDiagnosis: string; followUpDate?: string }

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

export default function DischargePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [admission, setAdmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>([])
  const [extraCharges, setExtraCharges] = useState<ChargeItem[]>([])
  const [createdInvoice, setCreatedInvoice] = useState<Record<string, unknown> | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<DischargeForm>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: { dischargeSummary: '', finalDiagnosis: '', followUpDate: '' },
  })

  useEffect(() => { fetchAdmission(); fetchServices() }, [params.id])

  const fetchAdmission = async () => {
    try { const r = await fetch(`/api/admissions/${params.id}`); if (r.ok) setAdmission(await r.json()) }
    finally { setLoading(false) }
  }

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        setServices(Array.isArray(data) ? data : [])
      }
    } catch {
      // Services are optional for discharge - continue without them
    }
  }

  const addCharge = () => {
    setExtraCharges([...extraCharges, { description: '', quantity: 1, unitPrice: 0, type: 'service' }])
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

  const addServiceAsCharge = (svc: ServiceItem) => {
    setExtraCharges([...extraCharges, { description: svc.name, quantity: 1, unitPrice: svc.price, type: 'service' }])
    toast(`${svc.name} added to charges`, 'success')
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  const handleDischarge = async (data: DischargeForm) => {
    setSaving(true)
    try {
      const r = await fetch(`/api/admissions/${params.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'discharged', ...data }),
      })
      if (!r.ok) { toast('Discharge failed', 'error'); return }

      try {
        const billRes = await fetch('/api/invoices/auto-ipd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admissionId: params.id,
            extraCharges: extraCharges.filter(c => c.description && c.unitPrice > 0),
          }),
        })
        if (billRes.ok) {
          const invoice = await billRes.json()
          setCreatedInvoice(invoice)
          toast(`Invoice ${invoice.invoiceNumber} created — ₹${invoice.total}`, 'success')
        } else {
          const err = await billRes.json().catch(() => ({}))
          toast(err.error || 'Discharge successful but bill generation failed', 'error')
        }
      } catch {
        toast('Discharge successful but bill generation failed', 'error')
      }
    } catch (e) { toast('Error', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!admission) return <div className="p-8 text-center text-red-500">Admission not found</div>
  if (createdInvoice) {
    const invId = String(createdInvoice.id)
    const invNumber = String(createdInvoice.invoiceNumber)
    const invTotal = Number(createdInvoice.total)
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/ipd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to IPD</Button></Link>
        </div>
        <Card className="max-w-md mx-auto border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <Receipt className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Discharged!</h2>
            <p className="text-gray-600 mb-4">Invoice {invNumber} generated</p>
            <p className="text-3xl font-bold text-green-700 mb-6">₹{invTotal.toLocaleString()}</p>
            <div className="flex gap-3 justify-center">
              <Link href={`/billing/${invId}/payment`}>
                <Button>Pay Now</Button>
              </Link>
              <Link href={`/billing/${invId}/receipt`}>
                <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Receipt</Button>
              </Link>
              <Link href="/ipd">
                <Button variant="ghost">IPD List</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysAdmitted = Math.max(1, Math.ceil((Date.now() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)))
  // A bed may never have been allocated (nurse step skipped) — no room charge.
  const roomRate = admission.room?.chargesPerDay ?? 0
  const estimatedRoomCharges = roomRate * daysAdmitted
  const extraChargesTotal = extraCharges.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/ipd/${params.id}`}><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admission</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Discharge Patient</h1>
        <p className="text-gray-600 mt-1">{admission.patient.name} | Admitted {new Date(admission.admissionDate).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Discharge Summary</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleDischarge)} className="space-y-4">
                <div><label className="text-sm font-medium">Final Diagnosis *</label><textarea {...register('finalDiagnosis')} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Final diagnosis after treatment..." />{errors.finalDiagnosis && <p className="text-xs text-red-500 mt-1">{errors.finalDiagnosis.message}</p>}</div>
                <div><label className="text-sm font-medium">Discharge Summary *</label><textarea {...register('dischargeSummary')} rows={5} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Treatment summary, condition at discharge, medications..." />{errors.dischargeSummary && <p className="text-xs text-red-500 mt-1">{errors.dischargeSummary.message}</p>}</div>
                <div><label className="text-sm font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Follow-up Date</label><input type="date" {...register('followUpDate')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>

                {/* Extra Charges */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Additional Charges</label>
                    <Button type="button" size="sm" variant="outline" onClick={addCharge}><Plus className="mr-1 h-3 w-3" /> Add</Button>
                  </div>

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
                  {extraCharges.length > 0 && (
                    <div className="space-y-2">
                      {extraCharges.map((charge, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
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
                          <div className="col-span-2"><Input type="number" min="1" value={charge.quantity} onChange={e => updateCharge(i, 'quantity', e.target.value)} className="h-9" /></div>
                          <div className="col-span-2"><Input type="number" step="0.01" value={charge.unitPrice} onChange={e => updateCharge(i, 'unitPrice', e.target.value)} className="h-9" /></div>
                          <div className="col-span-2"><p className="font-medium h-9 flex items-center text-sm">₹{(charge.quantity * charge.unitPrice).toFixed(2)}</p></div>
                          <div className="col-span-1"><Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Discharge & Generate Bill'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Patient Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Patient</span><span className="font-medium">{admission.patient.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">UHID</span><span>{admission.patient.uhid}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Doctor</span><span>Dr. {admission.doctor.user.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Ward</span><span>{admission.ward?.name ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Room/Bed</span><span>{admission.bed ? `${admission.room?.roomNumber} / ${admission.bed.bedNumber}` : 'Not allocated'}</span></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-600">Days Admitted</span><span className="font-medium">{daysAdmitted}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Room Rate</span><span>₹{roomRate}/day</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Room Charges</span><span className="font-medium">₹{estimatedRoomCharges.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Daily Rounds</span><span>{admission.dailyRounds?.length || 0}</span></div>
              {extraChargesTotal > 0 && <div className="flex justify-between"><span className="text-gray-600">Extra Charges</span><span className="font-medium">₹{extraChargesTotal.toLocaleString()}</span></div>}
              <hr />
              <div className="flex justify-between font-bold text-lg"><span>Est. Total</span><span className="text-green-600">₹{(estimatedRoomCharges + extraChargesTotal).toLocaleString()}</span></div>
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Auto-generated Invoice</p>
                <p className="text-blue-700">Invoice will be created with room charges, daily round charges, lab tests, and any extra charges added above.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
