"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'

interface MonthlyReport {
  month: string
  summary: {
    totalAppointments: number
    completedAppointments: number
    totalAdmissions: number
    totalDischarges: number
    newPatients: number
    totalRevenue: number
    totalCollected: number
    pendingAmount: number
    labOrders: number
  }
  departmentStats: { name: string; appointments: number; completed: number }[]
  revenueByType: { opd: number; ipd: number }
}

export default function MonthlyReportPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { fetchReport() }, [month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=monthly&month=${month}`)
      if (res.ok) setReport(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleExportExcel = () => {
    if (!report) return
    const data = [
      { Metric: 'Month', Value: report.month },
      { Metric: 'Total Appointments', Value: report.summary.totalAppointments },
      { Metric: 'Completed Appointments', Value: report.summary.completedAppointments },
      { Metric: 'Total Admissions', Value: report.summary.totalAdmissions },
      { Metric: 'Total Discharges', Value: report.summary.totalDischarges },
      { Metric: 'New Patients', Value: report.summary.newPatients },
      { Metric: 'Total Revenue', Value: report.summary.totalRevenue },
      { Metric: 'Collected', Value: report.summary.totalCollected },
      { Metric: 'Pending', Value: report.summary.pendingAmount },
      { Metric: 'Lab Orders', Value: report.summary.labOrders },
      { Metric: 'OPD Revenue', Value: report.revenueByType.opd },
      { Metric: 'IPD Revenue', Value: report.revenueByType.ipd },
    ]
    report.departmentStats.forEach((d) => {
      data.push({ Metric: `${d.name} Appointments`, Value: d.appointments })
    })
    exportToExcel(data, `monthly-report-${month}`)
  }

  const handleExportPDF = () => {
    if (!report) return
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Appointments', report.summary.totalAppointments],
      ['Completed', report.summary.completedAppointments],
      ['Admissions', report.summary.totalAdmissions],
      ['Discharges', report.summary.totalDischarges],
      ['New Patients', report.summary.newPatients],
      ['Revenue', `₹${report.summary.totalRevenue.toLocaleString()}`],
      ['Collected', `₹${report.summary.totalCollected.toLocaleString()}`],
      ['OPD Revenue', `₹${report.revenueByType.opd.toLocaleString()}`],
      ['IPD Revenue', `₹${report.revenueByType.ipd.toLocaleString()}`],
    ]
    exportToPDF(`Monthly Report - ${month}`, headers, rows, `monthly-report-${month}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Monthly Report</h1>
            <p className="text-gray-600 mt-1">Monthly operations summary</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
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
          {/* Summary */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Appointments', value: report.summary.totalAppointments },
              { label: 'Admissions', value: report.summary.totalAdmissions },
              { label: 'New Patients', value: report.summary.newPatients },
              { label: 'Revenue', value: `₹${report.summary.totalRevenue.toLocaleString()}` },
              { label: 'Lab Orders', value: report.summary.labOrders },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Department Breakdown */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>Department Performance</CardTitle></CardHeader>
              <CardContent>
                {report.departmentStats.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Department</th>
                        <th className="text-right p-2">Appointments</th>
                        <th className="text-right p-2">Completed</th>
                        <th className="text-right p-2">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.departmentStats.map((d, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium">{d.name}</td>
                          <td className="p-2 text-right">{d.appointments}</td>
                          <td className="p-2 text-right">{d.completed}</td>
                          <td className="p-2 text-right">
                            <Badge variant={d.appointments > 0 && (d.completed / d.appointments) > 0.8 ? 'default' : 'secondary'}>
                              {d.appointments > 0 ? Math.round((d.completed / d.appointments) * 100) : 0}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-center py-4">No department data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Revenue by Type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">OPD Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">₹{report.revenueByType.opd.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">IPD Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">₹{report.revenueByType.ipd.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Collected</p>
                    <p className="text-2xl font-bold text-green-600">₹{report.summary.totalCollected.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-red-600">₹{report.summary.pendingAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}
    </div>
  )
}
