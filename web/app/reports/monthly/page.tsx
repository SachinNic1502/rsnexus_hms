"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Calendar, DollarSign, Users, Award } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function MonthlyReportPage() {
  const { toast } = useToast()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=monthly&month=${month}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast('Failed to fetch monthly report', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between no-print print:hidden">
        <div>
          <Link href="/reports">
            <Button variant="ghost" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !data ? (
        <div className="text-center text-red-500 py-8">Failed to load report data</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Monthly Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.summary.totalAppointments}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.completedAppointments} completed visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">IPD Admissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.summary.totalAdmissions}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.totalDischarges} discharges completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">New Patients Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.summary.newPatients}</div>
                <p className="text-xs text-gray-600 mt-1">Growth in unique patient catalog</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Monthly Collections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{data.summary.totalCollected.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">Total revenue: ₹{data.summary.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Department load breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data.departmentStats.length > 0 && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Appointments vs Completed (Visual Load)</p>
                    <svg viewBox="0 0 400 160" className="w-full h-40">
                      {/* Grid Lines */}
                      <line x1="40" y1="120" x2="380" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />

                      {data.departmentStats.map((dept: any, idx: number) => {
                        const maxVal = Math.max(...data.departmentStats.map((d: any) => d.appointments), 1)
                        const totalHeight = (dept.appointments / maxVal) * 100
                        const completedHeight = (dept.completed / maxVal) * 100
                        const xOffset = 60 + idx * 80

                        return (
                          <g key={dept.name}>
                            {/* Total Appts Bar */}
                            <rect
                              x={xOffset}
                              y={120 - totalHeight}
                              width="16"
                              height={totalHeight}
                              fill="#3b82f6"
                              rx="2"
                            />
                            {/* Completed Appts Bar */}
                            <rect
                              x={xOffset + 18}
                              y={120 - completedHeight}
                              width="16"
                              height={completedHeight}
                              fill="#10b981"
                              rx="2"
                            />
                            {/* Labels */}
                            <text x={xOffset + 17} y="135" textAnchor="middle" className="text-[10px] fill-gray-500 font-medium">{dept.name.slice(0, 8)}</text>
                            <text x={xOffset + 8} y={115 - totalHeight} textAnchor="middle" className="text-[9px] font-bold fill-blue-600">{dept.appointments}</text>
                            <text x={xOffset + 26} y={115 - completedHeight} textAnchor="middle" className="text-[9px] font-bold fill-green-600">{dept.completed}</text>
                          </g>
                        )
                      })}
                    </svg>
                    <div className="flex gap-4 justify-center text-xs mt-1">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" /> Total</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded" /> Completed</span>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-700">Department</th>
                        <th className="p-3 font-semibold text-gray-700 text-center">Total Appointments</th>
                        <th className="p-3 font-semibold text-gray-700 text-center">Completed</th>
                        <th className="p-3 font-semibold text-gray-700 text-right">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.departmentStats.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No appointments recorded this month</td></tr>
                      ) : data.departmentStats.map((dept: any) => {
                        const rate = dept.appointments > 0 ? Math.round((dept.completed / dept.appointments) * 100) : 0
                        return (
                          <tr key={dept.name} className="border-b hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-900">{dept.name}</td>
                            <td className="p-3 text-center text-gray-600">{dept.appointments}</td>
                            <td className="p-3 text-center text-gray-600">{dept.completed}</td>
                            <td className="p-3 text-right font-semibold text-blue-600">{rate}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Billing breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue breakdown by category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {data.revenueByType.opd + data.revenueByType.ipd > 0 && (
                  <div className="mb-6 flex justify-center items-center p-4 border rounded-lg bg-gray-50/50 gap-6">
                    <svg width="120" height="120" viewBox="0 0 36 36" className="w-28 h-28">
                      {/* Background circle */}
                      <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3" />
                      {/* OPD Donut Segment */}
                      {(() => {
                        const total = data.revenueByType.opd + data.revenueByType.ipd
                        const opdPct = (data.revenueByType.opd / total) * 100
                        const ipdPct = (data.revenueByType.ipd / total) * 100
                        return (
                          <>
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeDasharray={`${opdPct} ${100 - opdPct}`}
                              strokeDashoffset="25"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="transparent"
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeDasharray={`${ipdPct} ${100 - ipdPct}`}
                              strokeDashoffset={25 - opdPct}
                            />
                          </>
                        )
                      })()}
                      <g className="text-center">
                        <text x="50%" y="54%" textAnchor="middle" className="text-[5px] font-bold fill-gray-800">
                          {data.summary.totalRevenue > 0
                            ? `${Math.round((data.summary.totalCollected / data.summary.totalRevenue) * 100)}%`
                            : '0%'}
                        </text>
                        <text x="50%" y="68%" textAnchor="middle" className="text-[3px] fill-gray-400 font-medium">Paid</text>
                      </g>
                    </svg>
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <p className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded" /> OPD: {data.revenueByType.opd > 0 ? Math.round((data.revenueByType.opd / (data.revenueByType.opd + data.revenueByType.ipd)) * 100) : 0}%</p>
                      <p className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded" /> IPD: {data.revenueByType.ipd > 0 ? Math.round((data.revenueByType.ipd / (data.revenueByType.opd + data.revenueByType.ipd)) * 100) : 0}%</p>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Out-Patient Department (OPD) Billing</span>
                    <span className="font-bold text-gray-900">₹{data.revenueByType.opd.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{
                        width: `${data.revenueByType.opd + data.revenueByType.ipd > 0
                          ? Math.round((data.revenueByType.opd / (data.revenueByType.opd + data.revenueByType.ipd)) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">In-Patient Department (IPD) Billing</span>
                    <span className="font-bold text-gray-900">₹{data.revenueByType.ipd.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${data.revenueByType.opd + data.revenueByType.ipd > 0
                          ? Math.round((data.revenueByType.ipd / (data.revenueByType.opd + data.revenueByType.ipd)) * 100)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 bg-blue-50/50 p-4 rounded-lg space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between font-medium">
                    <span>Total Monthly Invoiced:</span>
                    <span>₹{data.summary.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Collections Rate:</span>
                    <span>
                      {data.summary.totalRevenue > 0
                        ? Math.round((data.summary.totalCollected / data.summary.totalRevenue) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
