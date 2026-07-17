"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BedDouble, Stethoscope, FileText, Activity, Calendar, Loader2, Pill, Bed } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'
import { BedAllocationModal } from '@/components/bed-allocation-modal'

export default function AdmissionDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [admission, setAdmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAllocate, setShowAllocate] = useState(false)

  useEffect(() => { fetchAdmission() }, [params.id])

  const fetchAdmission = async () => {
    try {
      const r = await fetch(`/api/admissions/${params.id}`)
      if (r.ok) setAdmission(await r.json())
    } catch { toast('Failed to fetch admission', 'error') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!admission) return <div className="p-8 text-center text-red-500">Admission not found</div>

  const daysAdmitted = Math.max(1, Math.ceil((Date.now() - new Date(admission.admissionDate).getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/ipd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to IPD</Button></Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admission Details</h1>
            <p className="text-gray-600 mt-1">{admission.admissionNumber}</p>
          </div>
          <div className="flex gap-2">
            {admission.status === 'admitted' && (
              <>
                {!admission.bed && hasRole(['nurse', 'super_admin', 'hospital_admin']) && (
                  <Button onClick={() => setShowAllocate(true)}><Bed className="mr-2 h-4 w-4" /> Assign Ward &amp; Bed</Button>
                )}
                <Link href={`/ipd/${params.id}/daily-rounds`}><Button variant="outline"><Activity className="mr-2 h-4 w-4" /> Daily Round</Button></Link>
                {hasRole(['doctor', 'nurse']) && (
                  <Link href={`/ipd/${params.id}/discharge`}><Button><FileText className="mr-2 h-4 w-4" /> Discharge</Button></Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Patient & Admission Info */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Name</span><span className="font-medium">{admission.patient.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">UHID</span><span>{admission.patient.uhid}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Mobile</span><span>{admission.patient.mobile}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Admission Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Doctor</span><span className="font-medium">Dr. {admission.doctor.user.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Ward</span><span>{admission.ward ? `${admission.ward.name} (${admission.ward.type})` : <span className="text-amber-600">Not assigned</span>}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Room/Bed</span><span>{admission.bed ? `${admission.room?.roomNumber} / ${admission.bed.bedNumber}` : <span className="text-amber-600">Awaiting allocation</span>}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Admitted</span><span>{new Date(admission.admissionDate).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Days</span><span className="font-medium">{daysAdmitted}</span></div>
            {admission.expectedStayDays ? (
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Stay</span>
                <span className="font-medium">
                  {admission.expectedStayDays} days
                  {admission.status === 'admitted' && daysAdmitted > admission.expectedStayDays && (
                    <Badge variant="warning" className="ml-2">Exceeded</Badge>
                  )}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between"><span className="text-gray-600">Status</span><Badge variant={admission.status === 'admitted' ? 'default' : 'secondary'}>{admission.status}</Badge></div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Rounds */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Daily Rounds ({admission.dailyRounds?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {!admission.dailyRounds?.length ? (
            <p className="text-gray-500 text-center py-4">No daily rounds recorded yet</p>
          ) : (
            <div className="space-y-3">
              {admission.dailyRounds.map((round: any) => (
                <div key={round.id} className="p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{new Date(round.date).toLocaleDateString()}</p>
                    <div className="flex gap-3 text-sm text-gray-600">
                      {round.temperature && <span>🌡 {round.temperature}°F</span>}
                      {round.bloodPressure && <span>BP: {round.bloodPressure}</span>}
                      {round.pulse && <span>❤ {round.pulse} bpm</span>}
                      {round.oxygenSaturation && <span>SpO2: {round.oxygenSaturation}%</span>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{round.notes}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      {admission.invoices?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {admission.invoices.map((inv: any) => {
                const paid = inv.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{inv.invoiceNumber}</Badge>
                      <span className="text-sm">{inv.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">₹{inv.total.toLocaleString()}</span>
                      <Badge variant={inv.status === 'paid' ? 'default' : 'destructive'}>{inv.status}</Badge>
                      {hasRole(['billing_staff', 'receptionist', 'nurse']) && (
                        <Link href={`/billing/${inv.id}/payment`}><Button size="sm" variant="outline">Pay</Button></Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <BedAllocationModal
        admission={showAllocate && admission ? { id: admission.id, patient: { name: admission.patient.name, uhid: admission.patient.uhid } } : null}
        onClose={() => setShowAllocate(false)}
        onAllocated={() => { setShowAllocate(false); fetchAdmission() }}
      />
    </div>
  )
}
