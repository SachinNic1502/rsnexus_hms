"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, User, Phone, MapPin, Droplet, Calendar, FileText, Stethoscope,
  Pill, Loader2, Edit, Printer, Clock, Activity, Heart, Thermometer, Weight, Ruler,
  TestTube, DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface PatientData {
  id: string; uhid: string; name: string; mobile: string; gender: string
  dateOfBirth: string | null; age: number | null; address: string
  bloodGroup: string | null; emergencyContact: string | null
  emergencyContactNumber: string | null; createdAt: string
  bloodPressure: string | null; oxygenSaturation: number | null
  height: number | null; weight: number | null; temperature: number | null
  pulse: number | null
  consultations: any[]; prescriptions: any[]; appointments: any[]; labOrders?: any[]; invoices?: any[]
}

const bloodGroupDisplay: Record<string, string> = {
  A_positive: 'A+', A_negative: 'A-', B_positive: 'B+', B_negative: 'B-',
  AB_positive: 'AB+', AB_negative: 'AB-', O_positive: 'O+', O_negative: 'O-',
}

type Tab = 'profile' | 'visits' | 'prescriptions' | 'labOrders' | 'invoices'

function VitalsLineChart({ data, dataKey, label, color, unit, minVal, maxVal }: { data: any[], dataKey: string, label: string, color: string, unit: string, minVal: number, maxVal: number }) {
  const chartHeight = 130
  const chartWidth = 320
  const paddingLeft = 35
  const paddingRight = 15
  const paddingTop = 20
  const paddingBottom = 25

  const points = data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined)
  if (points.length === 0) return <p className="text-xs text-gray-500 text-center py-6">No data points recorded</p>

  const values = points.map(p => p[dataKey] as number)
  const min = Math.min(...values, minVal)
  const max = Math.max(...values, maxVal)
  const range = max - min === 0 ? 1 : max - min

  const getX = (index: number) => {
    if (points.length <= 1) return paddingLeft + (chartWidth - paddingLeft - paddingRight) / 2
    return paddingLeft + (index / (points.length - 1)) * (chartWidth - paddingLeft - paddingRight)
  }

  const getY = (value: number) => {
    return chartHeight - paddingBottom - ((value - min) / range) * (chartHeight - paddingTop - paddingBottom)
  }

  let pathD = ''
  points.forEach((p, idx) => {
    const x = getX(idx)
    const y = getY(p[dataKey])
    if (idx === 0) pathD = `M ${x} ${y}`
    else pathD += ` L ${x} ${y}`
  })

  return (
    <div className="bg-white border rounded-lg p-3 shadow-xs">
      <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{label} ({unit})</h4>
      <div className="relative">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {[min, min + range / 2, max].map((val, idx) => {
            const y = getY(val)
            return (
              <g key={idx} className="opacity-40">
                <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#e5e7eb" strokeDasharray="3,3" strokeWidth={1} />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fontSize={8} className="fill-gray-500 font-mono">
                  {val.toFixed(1)}
                </text>
              </g>
            )
          })}

          {points.map((p, idx) => {
            const x = getX(idx)
            return (
              <text key={idx} x={x} y={chartHeight - 6} textAnchor="middle" fontSize={8} className="fill-gray-500 font-mono opacity-80">
                {p.dateStr}
              </text>
            )
          })}

          {points.length > 1 && (
            <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {points.map((p, idx) => {
            const x = getX(idx)
            const y = getY(p[dataKey])
            return (
              <g key={idx} className="group">
                <circle cx={x} cy={y} r={4} fill={color} stroke="white" strokeWidth={1.5} className="transition-all cursor-pointer hover:r-6" />
                <title>{`${p.dateStr}: ${p[dataKey]} ${unit}`}</title>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function PatientDetailPage() {
  const params = useParams()
  const { hasRole } = useAuth()
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

  const getVitalsHistory = () => {
    if (!patient?.appointments) return []
    return patient.appointments
      .filter(apt => apt.temperature || apt.bloodPressure || apt.pulse || apt.oxygenSaturation || apt.weight || apt.height)
      .map(apt => ({
        date: new Date(apt.date),
        dateStr: new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        temp: apt.temperature || null,
        pulse: apt.pulse || null,
        spo2: apt.oxygenSaturation || null,
        weight: apt.weight || null,
        height: apt.height || null,
        bp: apt.bloodPressure || '',
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (error || !patient) return <div className="p-8 text-center text-red-500">{error || 'Patient not found'}</div>

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'visits', label: 'Visit History', icon: Clock },
    { key: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { key: 'labOrders', label: 'Lab Orders', icon: TestTube },
    { key: 'invoices', label: 'Billing Invoices', icon: DollarSign },
  ]

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse']}>
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

          {/* Vitals History Trends Chart */}
          {getVitalsHistory().length >= 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Vitals History & Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <VitalsLineChart
                    data={getVitalsHistory()}
                    dataKey="temp"
                    label="Temperature"
                    color="#f97316"
                    unit="°F"
                    minVal={97}
                    maxVal={102}
                  />
                  <VitalsLineChart
                    data={getVitalsHistory()}
                    dataKey="pulse"
                    label="Pulse / Heart Rate"
                    color="#ec4899"
                    unit="bpm"
                    minVal={60}
                    maxVal={100}
                  />
                  <VitalsLineChart
                    data={getVitalsHistory()}
                    dataKey="spo2"
                    label="SpO2 (Oxygen Saturation)"
                    color="#3b82f6"
                    unit="%"
                    minVal={90}
                    maxVal={100}
                  />
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

      {/* === Tab: Lab Orders === */}
      {activeTab === 'labOrders' && (
        <div className="space-y-6">
          {!patient.labOrders?.length ? (
            <div className="text-center py-12">
              <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No lab orders yet</p>
            </div>
          ) : (
            patient.labOrders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">Order: {order.orderNumber}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{new Date(order.orderedAt).toLocaleDateString()}</span>
                      <span>Dr. {order.doctor?.user?.name}</span>
                      <Badge variant={order.status === 'completed' ? 'success' : order.status === 'in_progress' ? 'warning' : 'secondary'}>
                        {order.status}
                      </Badge>
                      <Link href={`/lab/order/${order.id}`}>
                        <Button size="sm" variant="outline">View Results</Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Tests Ordered:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.tests?.map((t: any) => (
                        <Badge key={t.id} variant="secondary">
                          {t.testName} (₹{t.price})
                        </Badge>
                      ))}
                    </div>
                    {order.report && (
                      <div className="mt-4 pt-3 border-t bg-blue-50/30 p-3 rounded-md">
                        <p className="text-sm font-semibold text-blue-800 mb-2">Report Summary findings:</p>
                        <div className="space-y-1.5">
                          {Object.entries(order.report.results || {}).map(([key, val]) => (
                            <p key={key} className="text-xs text-gray-700">
                              <span className="font-medium">{key}:</span> {val as string}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* === Tab: Invoices === */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {!patient.invoices?.length ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No invoices yet</p>
            </div>
          ) : (
            patient.invoices.map((inv: any) => {
              const paid = inv.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0
              const due = inv.total - paid
              return (
                <Card key={inv.id}>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base">{inv.invoiceNumber} <span className="text-xs text-gray-500 font-normal">({inv.type})</span></CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                        <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'destructive'}>
                          {inv.status}
                        </Badge>
                        <Link href={`/billing/${inv.id}/receipt`}>
                          <Button size="sm" variant="outline">Receipt</Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      {inv.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0 border-gray-100">
                          <span className="text-gray-600">{item.description} (Qty: {item.quantity})</span>
                          <span className="font-semibold text-gray-800">₹{item.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 bg-gray-50 p-3 rounded-md font-medium text-gray-700">
                      <span>Total: ₹{inv.total.toLocaleString()}</span>
                      <span className="text-green-700">Paid: ₹{paid.toLocaleString()}</span>
                      {due > 0 && <span className="text-red-600">Due: ₹{due.toLocaleString()}</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
    </RoleGuard>
  )
}
