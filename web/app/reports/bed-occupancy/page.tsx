"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Loader2, BedDouble, Bed, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'

interface BedOccupancyReport {
  summary: {
    totalBeds: number
    occupiedBeds: number
    availableBeds: number
    occupancyRate: number
  }
  wards: {
    id: string
    name: string
    type: string
    totalBeds: number
    occupied: number
    available: number
    maintenance: number
    occupancyRate: number
    rooms: {
      id: string
      number: string
      type: string
      bedCount: number
      beds: {
        id: string
        number: string
        status: string
        patient: string | null
        doctor: string | null
        admittedAt: string | null
      }[]
    }[]
  }[]
  admittedPatients: {
    patient: string
    ward: string
    room: string
    bed: string
    doctor: string
    admittedAt: string
    daysAdmitted: number
  }[]
}

export default function BedOccupancyPage() {
  const [report, setReport] = useState<BedOccupancyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReport() }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reports?type=bed-occupancy')
      if (res.ok) setReport(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleExportExcel = () => {
    if (!report) return
    const data: any[] = [
      { Metric: 'Total Beds', Value: report.summary.totalBeds },
      { Metric: 'Occupied', Value: report.summary.occupiedBeds },
      { Metric: 'Available', Value: report.summary.availableBeds },
      { Metric: 'Occupancy Rate', Value: `${report.summary.occupancyRate}%` },
      { Metric: '---', Value: '---' },
    ]
    report.wards.forEach((w) => {
      data.push({ Metric: `${w.name} (Total)`, Value: w.totalBeds })
      data.push({ Metric: `${w.name} (Occupied)`, Value: w.occupied })
      data.push({ Metric: `${w.name} (Available)`, Value: w.available })
    })
    data.push({ Metric: '---', Value: '---' })
    report.admittedPatients.forEach((p) => {
      data.push({ Metric: p.patient, Value: `${p.ward} / R${p.room} / B${p.bed} - ${p.daysAdmitted} days` })
    })
    exportToExcel(data, `bed-occupancy-report`)
  }

  const handleExportPDF = () => {
    if (!report) return
    const headers = ['Ward', 'Total', 'Occupied', 'Available', 'Maintenance', 'Rate']
    const rows = report.wards.map((w) => [
      w.name, w.totalBeds, w.occupied, w.available, w.maintenance, `${w.occupancyRate}%`,
    ])
    rows.push(['TOTAL', report.summary.totalBeds, report.summary.occupiedBeds, report.summary.availableBeds, '', `${report.summary.occupancyRate}%`])
    exportToPDF('Bed Occupancy Report', headers, rows, 'bed-occupancy-report')
  }

  const bedStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300'
      case 'occupied': return 'bg-red-100 text-red-800 border-red-300'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100'
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/reports">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bed Occupancy Report</h1>
            <p className="text-gray-600 mt-1">Current bed status across all wards</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Beds', value: report.summary.totalBeds, icon: BedDouble, color: 'text-blue-600' },
              { label: 'Available', value: report.summary.availableBeds, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Occupied', value: report.summary.occupiedBeds, icon: Bed, color: 'text-red-600' },
              { label: 'Occupancy Rate', value: `${report.summary.occupancyRate}%`, icon: AlertTriangle, color: report.summary.occupancyRate > 80 ? 'text-red-600' : 'text-green-600' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ward-wise breakdown */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {report.wards.map((ward) => (
              <Card key={ward.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ward.name}</CardTitle>
                    <Badge variant="outline">{ward.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span>Total: <strong>{ward.totalBeds}</strong></span>
                    <span className="text-green-600">Avail: <strong>{ward.available}</strong></span>
                    <span className="text-red-600">Occ: <strong>{ward.occupied}</strong></span>
                    {ward.maintenance > 0 && (
                      <span className="text-yellow-600">Maint: <strong>{ward.maintenance}</strong></span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full ${ward.occupancyRate > 80 ? 'bg-red-500' : ward.occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${ward.occupancyRate}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {ward.rooms.map((room) =>
                      room.beds.map((bed) => (
                        <div
                          key={bed.id}
                          className={`p-1.5 rounded border text-center text-xs ${bedStatusColor(bed.status)}`}
                          title={bed.patient ? `${bed.patient} (${bed.doctor})` : bed.status}
                        >
                          <p className="font-medium">{bed.number}</p>
                          {bed.patient && <p className="truncate text-[10px]">{bed.patient}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Currently Admitted Patients */}
          {report.admittedPatients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Currently Admitted Patients ({report.admittedPatients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Patient</th>
                      <th className="text-left p-2">Ward</th>
                      <th className="text-left p-2">Room</th>
                      <th className="text-left p-2">Bed</th>
                      <th className="text-left p-2">Doctor</th>
                      <th className="text-right p-2">Days Admitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.admittedPatients.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{p.patient}</td>
                        <td className="p-2">{p.ward}</td>
                        <td className="p-2">{p.room}</td>
                        <td className="p-2">{p.bed}</td>
                        <td className="p-2">{p.doctor}</td>
                        <td className="p-2 text-right">
                          <Badge variant={p.daysAdmitted > 7 ? 'destructive' : 'secondary'}>
                            {p.daysAdmitted} days
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}
    </div>
  )
}
