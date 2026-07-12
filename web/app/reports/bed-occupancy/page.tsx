"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, BedDouble, Users, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

export default function BedOccupancyReportPage() {
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports?type=bed-occupancy')
      if (res.ok) setData(await res.json())
    } catch {
      toast('Failed to fetch bed occupancy report', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'occupied': return 'destructive'
      case 'available': return 'success'
      case 'maintenance': return 'warning'
      default: return 'default'
    }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between no-print print:hidden">
        <div>
          <Link href="/reports">
            <Button variant="ghost" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Bed Occupancy Analytics</h1>
        </div>
        <Button onClick={() => window.print()}>Print</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !data ? (
        <div className="text-center text-red-500 py-8">Failed to load report data</div>
      ) : (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Beds</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{data.summary.totalBeds}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Occupied Beds</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-red-600">{data.summary.occupiedBeds}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Available Beds</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-green-600">{data.summary.availableBeds}</div></CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500 uppercase">Occupancy Rate</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-blue-600">{data.summary.occupancyRate}%</div></CardContent>
            </Card>
          </div>
          {data.wards.length > 0 && (
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-lg">Occupancy Rate by Ward</CardTitle></CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bed Occupancy Proportions</p>
                  <svg viewBox="0 0 500 160" className="w-full h-40">
                    <line x1="40" y1="120" x2="480" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
                    <line x1="40" y1="70" x2="480" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />

                    {data.wards.map((ward: any, idx: number) => {
                      const barHeight = (ward.occupancyRate / 100) * 90
                      const xOffset = 60 + idx * 100

                      return (
                        <g key={ward.id}>
                          <rect
                            x={xOffset}
                            y={120 - barHeight}
                            width="36"
                            height={barHeight}
                            fill="#2563eb"
                            rx="3"
                          />
                          <text x={xOffset + 18} y="135" textAnchor="middle" className="text-[10px] fill-gray-500 font-medium">{ward.name}</text>
                          <text x={xOffset + 18} y={115 - barHeight} textAnchor="middle" className="text-[10px] font-bold fill-blue-600">{ward.occupancyRate}%</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wards breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Ward Breakdown & Bed Status</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {data.wards.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No wards registered in system</p>
              ) : data.wards.map((ward: any) => (
                <div key={ward.id} className="border p-4 rounded-lg bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{ward.name}</h3>
                      <p className="text-xs text-gray-500">Floor: {ward.floor} · Type: <span className="capitalize">{ward.type}</span></p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>Total: <span className="font-semibold">{ward.totalBeds}</span></span>
                      <span className="text-green-600">Available: <span className="font-semibold">{ward.available}</span></span>
                      <span className="text-red-600">Occupied: <span className="font-semibold">{ward.occupied}</span></span>
                      <span className="text-yellow-600">Maintenance: <span className="font-semibold">{ward.maintenance}</span></span>
                      <Badge variant="outline" className="font-bold text-blue-600 border-blue-200 bg-blue-50">{ward.occupancyRate}% Occupied</Badge>
                    </div>
                  </div>

                  {/* Rooms inside ward */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {ward.rooms.map((room: any) => (
                      <Card key={room.id} className="bg-white">
                        <CardContent className="p-3.5 space-y-2">
                          <p className="text-sm font-bold text-gray-700">Room {room.number} <span className="text-xs text-gray-400 font-normal">({room.type})</span></p>
                          <div className="flex flex-wrap gap-1.5">
                            {room.beds.map((bed: any) => (
                              <Badge
                                key={bed.id}
                                variant={getStatusColor(bed.status) as any}
                                className="text-[10px] cursor-help px-1.5 py-0.5"
                                title={bed.patient ? `Patient: ${bed.patient} · Admitted: ${new Date(bed.admittedAt).toLocaleDateString()}` : `Bed ${bed.number}`}
                              >
                                Bed {bed.number}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Admitted Patients details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Currently Admitted Patients ({data.admittedPatients.length})</CardTitle>
                <Users className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.admittedPatients.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No admitted patients</p>
                  ) : data.admittedPatients.map((ap: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{ap.patient}</p>
                        <p className="text-xs text-gray-500">{ap.ward} · Room {ap.room}, Bed {ap.bed}</p>
                        <p className="text-xs text-gray-400">Dr. {ap.doctor}</p>
                      </div>
                      <div className="text-right text-xs">
                        <Badge variant="outline">{ap.daysAdmitted} Days Admitted</Badge>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(ap.admittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Recent Discharges</CardTitle>
                <UserCheck className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.recentDischarges.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent discharges logged</p>
                  ) : data.recentDischarges.map((rd: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50/50">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{rd.patient}</p>
                        <p className="text-xs text-gray-500">{rd.ward} (Bed: {rd.bed})</p>
                      </div>
                      <div className="text-right text-xs">
                        <Badge variant="secondary">Discharged</Badge>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(rd.dischargedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  )
}
