"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, User, Phone, MapPin, Droplet, Calendar, FileText, Stethoscope,
  Pill, Loader2, Edit, Printer, Clock, Activity, Heart, Thermometer, Weight, Ruler
} from 'lucide-react'
import Link from 'next/link'

interface PatientData {
  id: string; uhid: string; name: string; mobile: string; gender: string
  dateOfBirth: string | null; age: number | null; address: string
  bloodGroup: string | null; emergencyContact: string | null
  emergencyContactNumber: string | null; createdAt: string
  bloodPressure: string | null; oxygenSaturation: number | null
  height: number | null; weight: number | null; temperature: number | null
  pulse: number | null
  consultations: any[]; prescriptions: any[]; appointments: any[]
}

const bloodGroupDisplay: Record<string, string> = {
  A_positive: 'A+', A_negative: 'A-', B_positive: 'B+', B_negative: 'B-',
  AB_positive: 'AB+', AB_negative: 'AB-', O_positive: 'O+', O_negative: 'O-',
}

type Tab = 'profile' | 'visits' | 'prescriptions'

export default function PatientDetailPage() {
  const params = useParams()
  const [patient, setPatient] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  useEffect(() => { fetchPatient() }, [params.id])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`)
      if (!res.ok) throw new Error('Patient not found')
      setPatient(await res.json())
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (error || !patient) return <div className="p-8 text-center text-red-500">{error || 'Patient not found'}</div>

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'visits', label: 'Visit History', icon: Clock },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/patients">
          <Button variant="ghost" className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-500">{patient.uhid} &middot; {patient.gender} &middot; Age {patient.age || 'N/A'}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/patients/${params.id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="mr-1 h-4 w-4" /> Edit</Button>
            </Link>
            <Link href="/registration">
              <Button size="sm"><Calendar className="mr-1 h-4 w-4" /> Book Appointment</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* === Tab: Profile === */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div><p className="text-xs text-gray-500">UHID</p><p className="font-medium font-mono">{patient.uhid}</p></div>
                <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{patient.name}</p></div>
                <div><p className="text-xs text-gray-500">Gender</p><p className="font-medium capitalize">{patient.gender}</p></div>
                <div><p className="text-xs text-gray-500">Age</p><p className="font-medium">{patient.age || 'N/A'} years</p></div>
                <div><p className="text-xs text-gray-500">Date of Birth</p><p className="font-medium">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500 flex items-center gap-1"><Droplet className="h-3 w-3" /> Blood Group</p><Badge variant="outline">{bloodGroupDisplay[patient.bloodGroup || ''] || 'N/A'}</Badge></div>
                <div><p className="text-xs text-gray-500"><Phone className="h-3 w-3 inline mr-1" /> Mobile</p><p className="font-medium">{patient.mobile}</p></div>
                <div className="md:col-span-2"><p className="text-xs text-gray-500"><MapPin className="h-3 w-3 inline mr-1" /> Address</p><p className="font-medium">{patient.address}</p></div>
                {patient.emergencyContact && (
                  <div><p className="text-xs text-gray-500">Emergency Contact</p><p className="font-medium">{patient.emergencyContact}</p><p className="text-sm text-gray-500">{patient.emergencyContactNumber}</p></div>
                )}
                <div><p className="text-xs text-gray-500"><Calendar className="h-3 w-3 inline mr-1" /> Registered</p><p className="font-medium">{new Date(patient.createdAt).toLocaleDateString()}</p></div>
              </div>
            </CardContent>
          </Card>

          {(patient.bloodPressure || patient.oxygenSaturation || patient.height || patient.weight || patient.temperature || patient.pulse) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {patient.temperature && (
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <Thermometer className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Temperature</p>
                      <p className="font-semibold">{patient.temperature}°F</p>
                    </div>
                  )}
                  {patient.bloodPressure && (
                    <div className="p-3 bg-red-50 rounded-lg text-center">
                      <Heart className="h-4 w-4 text-red-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">BP</p>
                      <p className="font-semibold">{patient.bloodPressure}</p>
                    </div>
                  )}
                  {patient.pulse && (
                    <div className="p-3 bg-pink-50 rounded-lg text-center">
                      <Heart className="h-4 w-4 text-pink-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Pulse</p>
                      <p className="font-semibold">{patient.pulse} bpm</p>
                    </div>
                  )}
                  {patient.oxygenSaturation && (
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <Activity className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">SpO2</p>
                      <p className="font-semibold">{patient.oxygenSaturation}%</p>
                    </div>
                  )}
                  {patient.weight && (
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Weight className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="font-semibold">{patient.weight} kg</p>
                    </div>
                  )}
                  {patient.height && (
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <Ruler className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Height</p>
                      <p className="font-semibold">{patient.height} cm</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* === Tab: Visit History === */}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          {patient.appointments.length === 0 && patient.consultations.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No visit history yet</p>
            </div>
          ) : (
            <>
              {patient.appointments.map((apt: any) => {
                const consultation = patient.consultations.find((c: any) => c.appointmentId === apt.id)
                return (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-sm text-gray-500">{apt.time} &middot; Token #{apt.tokenNumber}</p>
                          </div>
                        </div>
                        <Badge variant={apt.status === 'completed' ? 'success' : apt.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span><Stethoscope className="h-3 w-3 inline mr-1" /> Dr. {apt.doctor?.user?.name}</span>
                        <span>{apt.department?.name}</span>
                        {apt.consultationType && (
                          <Badge variant="outline" className="text-[10px]">
                            {apt.consultationType === 'new' ? 'New Visit' : 'Follow-up'}
                          </Badge>
                        )}
                      </div>

                      {consultation && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-500">Chief Complaint:</span> <span className="font-medium">{consultation.chiefComplaint}</span></div>
                            <div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{consultation.diagnosis || '-'}</span></div>
                          </div>
                          {consultation.clinicalNotes && (
                            <p className="text-sm text-gray-600 mt-1">{consultation.clinicalNotes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* === Tab: Prescriptions === */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          {patient.prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No prescriptions yet</p>
            </div>
          ) : (
            patient.prescriptions.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">Prescription</CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      <span>Dr. {p.doctor?.user?.name}</span>
                      <Link href={`/prescriptions/${p.id}`}>
                        <Button variant="ghost" size="sm"><Printer className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {p.medicines?.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{m.medicineName}</span>
                            <Badge variant="outline" className="ml-2 text-[10px]">{m.dose}</Badge>
                          </div>
                          <span className="text-sm text-gray-500">{m.frequency} &middot; {m.duration}</span>
                        </div>
                        {(m.timing || m.foodInstruction || m.usageInstructions) && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {m.timing && <span className="text-xs text-gray-500">Timing: {m.timing}</span>}
                            {m.foodInstruction && <span className="text-xs text-gray-500">Food: {m.foodInstruction}</span>}
                            {m.usageInstructions && <span className="text-xs text-gray-500">Usage: {m.usageInstructions}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
