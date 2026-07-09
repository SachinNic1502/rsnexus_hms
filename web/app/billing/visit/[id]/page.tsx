"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Loader2, CheckCircle, Printer, Plus, Trash2,
  User, Stethoscope, Calendar, Pill, FileText, DollarSign, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface ExtraCharge {
  description: string
  quantity: number
  unitPrice: number
  type: string
}

export default function VisitBillingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [appointment, setAppointment] = useState<any>(null)
  const [consultation, setConsultation] = useState<any>(null)
  const [prescription, setPrescription] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)
  const [isAdmitted, setIsAdmitted] = useState(false)
  const [error, setError] = useState('')

  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([])

  useEffect(() => { fetchData() }, [params.id])

  const fetchData = async () => {
    try {
      const aptRes = await fetch(`/api/appointments/${params.id}`)
      if (!aptRes.ok) throw new Error('Appointment not found')
      const apt = await aptRes.json()
      setAppointment(apt)

      if (apt.consultation) {
        setConsultation(apt.consultation)
        const presRes = await fetch(`/api/prescriptions?consultationId=${apt.consultation.id}`)
        if (presRes.ok) {
          const presData = await presRes.json()
          if (Array.isArray(presData) && presData.length > 0) {
            setPrescription(presData[0])
          }
        }
      }

      const invRes = await fetch(`/api/invoices?appointmentId=${params.id}`)
      if (invRes.ok) {
        const invData = await invRes.json()
        if (Array.isArray(invData) && invData.length > 0) {
          setInvoice(invData[0])
        }
      }

      // Check if patient has active IPD admission
      const admRes = await fetch('/api/admissions?status=admitted')
      if (admRes.ok) {
        const admissions = await admRes.json()
        const admitted = admissions.some((adm: any) => adm.patientId === apt.patientId)
        setIsAdmitted(admitted)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addCharge = () => {
    setExtraCharges([...extraCharges, { description: '', quantity: 1, unitPrice: 0, type: 'service' }])
  }

  const removeCharge = (i: number) => {
    setExtraCharges(extraCharges.filter((_, idx) => idx !== i))
  }

  const updateCharge = (i: number, field: string, value: any) => {
    const updated = [...extraCharges]
    ;(updated as any)[i][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
    setExtraCharges(updated)
  }

  const generateInvoice = async () => {
    if (!consultation) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/invoices/auto-opd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation.id,
          extraCharges,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate invoice')
      }
      const inv = await res.json()
      setInvoice(inv)
      toast(`Invoice generated! Total: ₹${inv.total.toLocaleString()}`, 'success')
    } catch (err: any) {
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error && !appointment) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  if (!appointment) {
    return <div className="p-8 text-center">Appointment not found</div>
  }

  const patient = appointment.patient
  const doctor = appointment.doctor
  const doctorUser = doctor?.user
  const department = appointment.department

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/opd">
          <Button variant="ghost" className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to OPD
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Visit Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Review consultation and generate invoice</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-md mb-4">{error}</div>
      )}

      {/* Visit Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Patient</p>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-gray-500">{patient.uhid} &middot; {patient.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Stethoscope className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Doctor</p>
                <p className="font-semibold">Dr. {doctorUser?.name}</p>
                <p className="text-sm text-gray-500">{department?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Appointment</p>
                <p className="font-semibold">{appointment.time}</p>
                <p className="text-sm text-gray-500">{new Date(appointment.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {appointment.status !== 'completed' && !invoice && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">
              This appointment has not been completed yet. Please wait for the doctor to complete the consultation before billing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consultation Details */}
      {consultation && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Chief Complaint</p>
                <p className="font-medium">{consultation.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Diagnosis</p>
                <p className="font-medium">{consultation.diagnosis || '-'}</p>
              </div>
              {consultation.symptoms && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Symptoms</p>
                  <p className="font-medium">{consultation.symptoms}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescribed Medicines */}
      {prescription && prescription.medicines && prescription.medicines.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" /> Prescribed Medicines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prescription.medicines.map((med: any, i: number) => (
                <div key={med.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{med.medicineName}</span>
                    <span className="text-sm text-gray-500 ml-2">{med.dose}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {med.frequency} &middot; {med.duration}
                    {med.timing && <span> &middot; {med.timing}</span>}
                    {med.foodInstruction && <span> &middot; {med.foodInstruction}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Section */}
      {isAdmitted ? (
        <Card className="mb-6 border-indigo-200 bg-indigo-50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-indigo-600 mb-3 animate-bounce" />
            <h3 className="text-lg font-semibold text-indigo-800">IPD Admitted Patient</h3>
            <p className="text-sm text-indigo-700 max-w-md mt-1 mb-4">
              This patient is currently admitted to the hospital. All consultation charges and medicines will be consolidated into their final IPD discharge bill.
            </p>
            <div className="flex gap-3">
              <Link href="/ipd">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Go to IPD Management</Button>
              </Link>
              <Link href="/opd/billing-queue">
                <Button variant="outline">Back to Queue</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : invoice ? (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" /> Invoice Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <p className="font-semibold text-lg">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="font-bold text-2xl text-green-700">₹{invoice.total.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {invoice.items && invoice.items.length > 0 && (
              <div className="space-y-2 mb-4">
                {invoice.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      <span>{item.description}</span>
                    </div>
                    <span>₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Link href={`/billing/${invoice.id}/receipt`}>
                <Button>
                  <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
              </Link>
              <Link href={`/billing/${invoice.id}/payment`}>
                <Button variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" /> Record Payment
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost">View All Bills</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        appointment.status === 'completed' && consultation && (
          <>
            {/* Extra Charges */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Additional Charges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {extraCharges.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No additional charges. The invoice will include consultation fee and medicine costs automatically.
                  </p>
                )}
                {extraCharges.map((charge, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <label className="text-xs font-medium">Description</label>
                      <Input
                        value={charge.description}
                        onChange={e => updateCharge(i, 'description', e.target.value)}
                        placeholder="e.g., Dressing, Injection"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Qty</label>
                      <Input type="number" min="1" value={charge.quantity} onChange={e => updateCharge(i, 'quantity', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Price (₹)</label>
                      <Input type="number" step="0.01" value={charge.unitPrice} onChange={e => updateCharge(i, 'unitPrice', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium">Total</label>
                      <p className="font-medium h-10 flex items-center">₹{(charge.quantity * charge.unitPrice).toFixed(2)}</p>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCharge(i)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addCharge}>
                  <Plus className="mr-1 h-3 w-3" /> Add Charge
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={generateInvoice} disabled={saving} size="lg">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate Invoice
              </Button>
            </div>
          </>
        )
      )}
    </div>
  )
}
