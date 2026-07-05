"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, User, Phone, MapPin, Droplet, Calendar, Stethoscope,
  Loader2, Edit, Printer, Receipt, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/toast'

interface PatientData {
  id: string
  uhid: string
  name: string
  mobile: string
  gender: string
  dateOfBirth: string | null
  age: number | null
  address: string
  bloodGroup: string | null
  emergencyContact: string | null
  emergencyContactNumber: string | null
  createdAt: string
  appointments: any[]
  consultations: any[]
  invoices: any[]
}

const bloodGroupDisplay: Record<string, string> = {
  A_positive: 'A+', A_negative: 'A-',
  B_positive: 'B+', B_negative: 'B-',
  AB_positive: 'AB+', AB_negative: 'AB-',
  O_positive: 'O+', O_negative: 'O-',
}

const statusColor: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  completed: 'success',
  in_progress: 'warning',
  waiting: 'default',
  scheduled: 'secondary',
  cancelled: 'secondary',
}

function MedicineInstructionsEditor({ prescriptionId, medicine, onSaved }: {
  prescriptionId: string
  medicine: { id: string; medicineName: string; timing?: string | null; foodInstructions?: string | null; usageInstructions?: string | null }
  onSaved: (updated: { id: string; timing: string; foodInstructions: string; usageInstructions: string }) => void
}) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [timing, setTiming] = useState(medicine.timing || '')
  const [foodInstructions, setFoodInstructions] = useState(medicine.foodInstructions || '')
  const [usageInstructions, setUsageInstructions] = useState(medicine.usageInstructions || '')

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: [{ id: medicine.id, timing, foodInstructions, usageInstructions }] }),
      })
      if (!res.ok) throw new Error('Failed to save instructions')
      onSaved({ id: medicine.id, timing, foodInstructions, usageInstructions })
      toast('Medicine instructions saved', 'success')
      setEditing(false)
    } catch (err: any) {
      toast(err.message || 'Failed to save instructions', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        {(timing || foodInstructions || usageInstructions) && (
          <p className="text-xs text-gray-500">
            {[timing, foodInstructions, usageInstructions].filter(Boolean).join(' · ')}
          </p>
        )}
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditing(true)}>
          {(timing || foodInstructions || usageInstructions) ? 'Edit' : 'Add'} timing / food / usage instructions
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
      <Input value={timing} onChange={e => setTiming(e.target.value)} placeholder="Timing (e.g. Morning, Night)" className="h-8 text-xs" />
      <Input value={foodInstructions} onChange={e => setFoodInstructions(e.target.value)} placeholder="Food instructions (e.g. After food)" className="h-8 text-xs" />
      <Input value={usageInstructions} onChange={e => setUsageInstructions(e.target.value)} placeholder="Usage instructions" className="h-8 text-xs" />
      <div className="md:col-span-3 flex gap-2">
        <Button type="button" size="sm" className="h-7 text-xs" disabled={saving} onClick={save}>{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}</Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}

export default function PatientDetailPage() {
  const params = useParams()
  const { hasRole } = useAuth()
  const { toast } = useToast()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [billingBusyId, setBillingBusyId] = useState<string | null>(null)

  const isFrontDesk = hasRole(['super_admin', 'hospital_admin', 'receptionist'])
  const isDoctor = hasRole(['doctor'])
  const isNurse = hasRole(['nurse'])

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`)
      if (!res.ok) throw new Error('Patient not found')
      setPatient(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateBill = async (consultationId: string) => {
    setBillingBusyId(consultationId)
    try {
      const res = await fetch('/api/invoices/auto-opd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate bill')
      toast(`Invoice ${data.invoiceNumber} created — ₹${data.total}`, 'success')
      fetchPatient()
    } catch (err: any) {
      toast(err.message || 'Failed to generate bill', 'error')
    } finally {
      setBillingBusyId(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error || !patient) {
    return <div className="p-8 text-center text-red-500">{error || 'Patient not found'}</div>
  }

  const consultationByAppointment = new Map(
    patient.consultations.map((c: any) => [c.appointmentId, c])
  )
  const invoicesByAppointment = new Map<string, any[]>()
  patient.invoices.forEach((inv: any) => {
    if (!inv.appointmentId) return
    const arr = invoicesByAppointment.get(inv.appointmentId) || []
    arr.push(inv)
    invoicesByAppointment.set(inv.appointmentId, arr)
  })

  const visits = [...patient.appointments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const inProgressAppointment = patient.appointments.find(
    (a: any) => a.status === 'waiting' || a.status === 'in_progress'
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/patients">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
      </div>

      {/* Patient Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><p className="text-sm text-gray-600">UHID</p><p className="font-medium">{patient.uhid}</p></div>
            <div><p className="text-sm text-gray-600">Name</p><p className="font-medium">{patient.name}</p></div>
            <div><p className="text-sm text-gray-600">Gender</p><p className="font-medium capitalize">{patient.gender}</p></div>
            <div><p className="text-sm text-gray-600">Age</p><p className="font-medium">{patient.age || 'N/A'} years</p></div>
            <div><p className="text-sm text-gray-600">Date of Birth</p><p className="font-medium">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
            <div><p className="text-sm text-gray-600 flex items-center gap-2"><Droplet className="h-4 w-4" /> Blood Group</p><Badge variant="outline">{bloodGroupDisplay[patient.bloodGroup || ''] || 'N/A'}</Badge></div>
            <div><p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4" /> Mobile</p><p className="font-medium">{patient.mobile}</p></div>
            <div className="md:col-span-2"><p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</p><p className="font-medium">{patient.address}</p></div>
            {patient.emergencyContact && (
              <div><p className="text-sm text-gray-600">Emergency Contact</p><p className="font-medium">{patient.emergencyContact}</p><p className="text-sm text-gray-600">{patient.emergencyContactNumber}</p></div>
            )}
            <div><p className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="h-4 w-4" /> Registered On</p><p className="font-medium">{new Date(patient.createdAt).toLocaleDateString()}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions (role-based) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isFrontDesk && (
          <Link href={`/patients/${params.id}/edit`}><Button variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Patient</Button></Link>
        )}
        {isFrontDesk && (
          <Link href={`/patients/register?patientId=${patient.id}&uhid=${patient.uhid}&name=${encodeURIComponent(patient.name)}`}>
            <Button className="w-full"><Calendar className="mr-2 h-4 w-4" /> New Visit</Button>
          </Link>
        )}
        {isFrontDesk && (
          <Link href={`/billing?patientId=${patient.id}`}><Button variant="outline" className="w-full"><Receipt className="mr-2 h-4 w-4" /> Billing</Button></Link>
        )}
        {isDoctor && inProgressAppointment && (
          <Link href={`/opd/consultation/${inProgressAppointment.id}`}>
            <Button className="w-full"><Stethoscope className="mr-2 h-4 w-4" /> Continue Consultation</Button>
          </Link>
        )}
      </div>

      {/* Visit History */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Visit History</CardTitle></CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No visits yet</p>
          ) : (
            <div className="space-y-4">
              {visits.map((visit: any) => {
                const consultation = consultationByAppointment.get(visit.id)
                const invoices = invoicesByAppointment.get(visit.id) || []
                const prescription = consultation?.prescription
                const nurseTimingAdded = prescription?.medicines?.some(
                  (m: any) => m.timing || m.foodInstructions || m.usageInstructions
                )
                const canBillThisVisit = isFrontDesk || (isNurse && nurseTimingAdded)
                const vitalsParts = consultation ? [
                  consultation.bloodPressure ? `BP ${consultation.bloodPressure}` : null,
                  consultation.oxygenSaturation ? `SpO2 ${consultation.oxygenSaturation}%` : null,
                  consultation.temperature ? `Temp ${consultation.temperature}°F` : null,
                  consultation.pulse ? `Pulse ${consultation.pulse} bpm` : null,
                  consultation.height ? `Height ${consultation.height} cm` : null,
                  consultation.weight ? `Weight ${consultation.weight} kg` : null,
                ].filter(Boolean) : []

                return (
                  <div key={visit.id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{new Date(visit.date).toLocaleDateString()}</p>
                        <span className="text-sm text-gray-600">Dr. {visit.doctor?.user?.name} &middot; {visit.department?.name}</span>
                        {visit.consultationType === 'follow_up' && <Badge variant="outline">Follow-up</Badge>}
                      </div>
                      <Badge variant={statusColor[visit.status] || 'secondary'}>{visit.status.replace('_', ' ')}</Badge>
                    </div>

                    {vitalsParts.length > 0 && (
                      <p className="text-xs text-gray-600 mb-2">{vitalsParts.join(' · ')}</p>
                    )}

                    {consultation?.diagnosis && (
                      <div className="text-sm mb-2"><span className="text-gray-600">Diagnosis:</span> {consultation.diagnosis}</div>
                    )}

                    {prescription?.medicines?.length > 0 && (
                      <div className="space-y-2 mb-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Prescription</p>
                        {prescription.medicines.map((m: any) => (
                          <div key={m.id} className="text-sm p-2 bg-blue-50 rounded">
                            <p className="font-medium">{m.medicineName}</p>
                            <p className="text-gray-600">{[m.dose, m.frequency, m.duration].filter(Boolean).join(' - ')}</p>
                            {(isFrontDesk || isNurse) && (
                              <MedicineInstructionsEditor
                                prescriptionId={prescription.id}
                                medicine={m}
                                onSaved={(updated) => {
                                  m.timing = updated.timing
                                  m.foodInstructions = updated.foodInstructions
                                  m.usageInstructions = updated.usageInstructions
                                  setPatient({ ...patient })
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      {prescription && !isDoctor && (
                        <Link href={`/prescriptions/${prescription.id}`}>
                          <Button variant="ghost" size="sm"><Printer className="h-4 w-4 mr-1" /> Print Prescription</Button>
                        </Link>
                      )}
                      {canBillThisVisit && invoices.length === 0 && consultation && (
                        <Button size="sm" variant="outline" disabled={billingBusyId === consultation.id} onClick={() => generateBill(consultation.id)}>
                          {billingBusyId === consultation.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Receipt className="h-4 w-4 mr-1" />} Generate Bill
                        </Button>
                      )}
                      {invoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center gap-2">
                          <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{inv.invoiceNumber} &middot; {inv.status}</Badge>
                          {canBillThisVisit && inv.status !== 'paid' && (
                            <Link href={`/billing/${inv.id}/payment`}><Button size="sm" variant="outline">Pay</Button></Link>
                          )}
                          <Link href={`/billing/${inv.id}/receipt`}><Button size="sm" variant="ghost"><Printer className="h-4 w-4 mr-1" /> Receipt</Button></Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
