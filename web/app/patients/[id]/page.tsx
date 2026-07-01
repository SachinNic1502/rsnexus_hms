"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Phone, MapPin, Droplet, Calendar, FileText, Stethoscope, Pill, Loader2, Edit, Printer } from 'lucide-react'
import Link from 'next/link'

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
  consultations: any[]
  prescriptions: any[]
  labOrders: any[]
  admissions: any[]
}

const bloodGroupDisplay: Record<string, string> = {
  A_positive: 'A+', A_negative: 'A-',
  B_positive: 'B+', B_negative: 'B-',
  AB_positive: 'AB+', AB_negative: 'AB-',
  O_positive: 'O+', O_negative: 'O-',
}

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (error || !patient) {
    return <div className="p-8 text-center text-red-500">{error || 'Patient not found'}</div>
  }

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Link href={`/patients/${params.id}/edit`}><Button variant="outline" className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit Patient</Button></Link>
        <Link href="/appointments/new"><Button className="w-full"><Calendar className="mr-2 h-4 w-4" /> Book Appointment</Button></Link>
        <Link href="/billing/new"><Button variant="outline" className="w-full">Generate Bill</Button></Link>
        <Link href="/ipd/admit"><Button variant="outline" className="w-full">Admit Patient</Button></Link>
      </div>

      {/* Consultations */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Consultations</CardTitle></CardHeader>
        <CardContent>
          {patient.consultations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No consultations yet</p>
          ) : (
            <div className="space-y-4">
              {patient.consultations.map((c: any) => (
                <div key={c.id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{new Date(c.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Dr. {c.doctor?.user?.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-600">Chief Complaint:</span> {c.chiefComplaint}</div>
                    <div><span className="text-gray-600">Diagnosis:</span> {c.diagnosis}</div>
                  </div>
                  {c.clinicalNotes && <p className="text-sm text-gray-700 mt-2">{c.clinicalNotes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" /> Prescriptions</CardTitle></CardHeader>
        <CardContent>
          {patient.prescriptions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No prescriptions yet</p>
          ) : (
            <div className="space-y-4">
              {patient.prescriptions.map((p: any) => (
                <div key={p.id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{new Date(p.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Dr. {p.doctor?.user?.name}</p>
                    </div>
                    <Link href={`/prescriptions/${p.id}`}>
                      <Button variant="ghost" size="sm"><Printer className="h-4 w-4 mr-1" /> Print</Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {p.medicines?.map((m: any, idx: number) => (
                      <div key={idx} className="text-sm p-2 bg-blue-50 rounded">
                        <p className="font-medium">{m.medicineName}</p>
                        <p className="text-gray-600">{m.dose} - {m.frequency} - {m.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Orders */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Lab Orders</CardTitle></CardHeader>
        <CardContent>
          {patient.labOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No lab orders yet</p>
          ) : (
            <div className="space-y-4">
              {patient.labOrders.map((lo: any) => (
                <div key={lo.id} className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{lo.orderNumber}</Badge>
                      <Badge variant={lo.status === 'completed' ? 'success' : 'secondary'}>{lo.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{new Date(lo.orderedAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-gray-600">{lo.tests?.map((t: any) => t.testName).join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
