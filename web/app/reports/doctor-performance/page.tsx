"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'

interface DoctorPerformance {
  doctorId: string
  name: string
  department: string
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  consultations: number
  labOrders: number
  prescriptions: number
  completionRate: number
}

export default function DoctorPerformancePage() {
  const [doctors, setDoctors] = useState<DoctorPerformance[]>([])
  const [allDoctors, setAllDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedDoctor, setSelectedDoctor] = useState('all')

  useEffect(() => { fetchReport(); fetchDoctors() }, [month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const url = selectedDoctor !== 'all'
        ? `/api/reports?type=doctor-performance&month=${month}&doctorId=${selectedDoctor}`
        : `/api/reports?type=doctor-performance&month=${month}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDoctors(data.doctors)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [selectedDoctor])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors')
      if (res.ok) setAllDoctors(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleExportExcel = () => {
    const data = doctors.map((d) => ({
      Doctor: d.name,
      Department: d.department,
      Appointments: d.totalAppointments,
      Completed: d.completedAppointments,
      Cancelled: d.cancelledAppointments,
      Consultations: d.consultations,
      'Lab Orders': d.labOrders,
      Prescriptions: d.prescriptions,
      'Completion Rate': `${d.completionRate}%`,
    }))
    exportToExcel(data, `doctor-performance-${month}`)
  }

  const handleExportPDF = () => {
    const headers = ['Doctor', 'Dept', 'Appts', 'Completed', 'Rate', 'Consultations', 'Lab Orders']
    const rows = doctors.map((d) => [
      d.name, d.department, d.totalAppointments, d.completedAppointments,
      `${d.completionRate}%`, d.consultations, d.labOrders,
    ])
    exportToPDF(`Doctor Performance - ${month}`, headers, rows, `doctor-performance-${month}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Doctor Performance</h1>
            <p className="text-gray-600 mt-1">Doctor-wise appointment and consultation stats</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            />
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="all">All Doctors</option>
              {allDoctors.map((d: any) => (
                <option key={d.id} value={d.id}>Dr. {d.user.name}</option>
              ))}
            </select>
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
      ) : doctors.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Doctor</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-right p-3">Appointments</th>
                  <th className="text-right p-3">Completed</th>
                  <th className="text-right p-3">Cancelled</th>
                  <th className="text-right p-3">Completion Rate</th>
                  <th className="text-right p-3">Consultations</th>
                  <th className="text-right p-3">Lab Orders</th>
                  <th className="text-right p-3">Prescriptions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.doctorId} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">Dr. {doc.name}</td>
                    <td className="p-3">{doc.department}</td>
                    <td className="p-3 text-right">{doc.totalAppointments}</td>
                    <td className="p-3 text-right">{doc.completedAppointments}</td>
                    <td className="p-3 text-right">{doc.cancelledAppointments}</td>
                    <td className="p-3 text-right">
                      <Badge
                        variant={doc.completionRate >= 80 ? 'default' : doc.completionRate >= 50 ? 'secondary' : 'destructive'}
                      >
                        {doc.completionRate}%
                      </Badge>
                    </td>
                    <td className="p-3 text-right">{doc.consultations}</td>
                    <td className="p-3 text-right">{doc.labOrders}</td>
                    <td className="p-3 text-right">{doc.prescriptions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No doctor performance data available for this period.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
