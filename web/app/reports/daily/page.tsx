"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Loader2, Calendar, Users, BedDouble, IndianRupee, TestTube } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'

interface DailyReport {
  date: string
  summary: {
    totalAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    newAdmissions: number
    discharges: number
    totalRevenue: number
    totalCollected: number
    pendingAmount: number
    labOrders: number
    labCompleted: number
  }
  appointments: any[]
  admissions: any[]
  discharges: any[]
  invoices: any[]
}

export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { fetchReport() }, [date])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=daily&date=${date}`)
      if (res.ok) setReport(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleExportExcel = () => {
    if (!report) return
    const data = [
      { Metric: 'Date', Value: report.date },
      { Metric: 'Total Appointments', Value: report.summary.totalAppointments },
      { Metric: 'Completed', Value: report.summary.completedAppointments },
      { Metric: 'Cancelled', Value: report.summary.cancelledAppointments },
      { Metric: 'New Admissions', Value: report.summary.newAdmissions },
      { Metric: 'Discharges', Value: report.summary.discharges },
      { Metric: 'Total Revenue', Value: report.summary.totalRevenue },
      { Metric: 'Collected', Value: report.summary.totalCollected },
      { Metric: 'Pending', Value: report.summary.pendingAmount },
      { Metric: 'Lab Orders', Value: report.summary.labOrders },
    ]
    exportToExcel(data, `daily-report-${date}`)
  }

  const handleExportPDF = () => {
    if (!report) return
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Appointments', report.summary.totalAppointments],
      ['Completed', report.summary.completedAppointments],
      ['Cancelled', report.summary.cancelledAppointments],
      ['New Admissions', report.summary.newAdmissions],
      ['Discharges', report.summary.discharges],
      ['Total Revenue', `₹${report.summary.totalRevenue.toLocaleString()}`],
      ['Collected', `₹${report.summary.totalCollected.toLocaleString()}`],
      ['Pending', `₹${report.summary.pendingAmount.toLocaleString()}`],
    ]
    exportToPDF(`Daily Report - ${date}`, headers, rows, `daily-report-${date}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
            <p className="text-gray-600 mt-1">Daily hospital operations summary</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            />
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
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Appointments', value: report.summary.totalAppointments, icon: Users, color: 'text-blue-600' },
              { label: 'Admissions', value: report.summary.newAdmissions, icon: BedDouble, color: 'text-green-600' },
              { label: 'Discharges', value: report.summary.discharges, icon: BedDouble, color: 'text-purple-600' },
              { label: 'Revenue', value: `₹${report.summary.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-orange-600' },
              { label: 'Lab Orders', value: report.summary.labOrders, icon: TestTube, color: 'text-cyan-600' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Appointments Table */}
          {report.appointments.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Appointments ({report.appointments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Token</th>
                      <th className="text-left p-2">Patient</th>
                      <th className="text-left p-2">Doctor</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.appointments.map((apt: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-2">#{apt.tokenNumber}</td>
                        <td className="p-2">{apt.patient}</td>
                        <td className="p-2">{apt.doctor}</td>
                        <td className="p-2">{apt.department}</td>
                        <td className="p-2">{apt.time}</td>
                        <td className="p-2">
                          <Badge variant={apt.status === 'completed' ? 'default' : 'secondary'}>
                            {apt.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">₹{report.summary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Collected</p>
                  <p className="text-2xl font-bold text-blue-600">₹{report.summary.totalCollected.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-red-600">₹{report.summary.pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}
    </div>
  )
}
