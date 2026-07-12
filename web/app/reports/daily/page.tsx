"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

export default function DailyReportPage() {
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [date])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=daily&date=${date}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast('Failed to fetch daily report', 'error')
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Daily Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.summary.totalAppointments}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.completedAppointments} completed · {data.summary.cancelledAppointments} cancelled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Admissions & Discharges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">+{data.summary.newAdmissions} / -{data.summary.discharges}</div>
                <p className="text-xs text-gray-600 mt-1">New admissions vs discharged patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Daily Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{data.summary.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">Collected: ₹{data.summary.totalCollected.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Lab Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.summary.labOrders}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.labCompleted} completed tests</p>
              </CardContent>
            </Card>
          </div>

          {/* Details Tabs/Tables */}
          <div className="grid grid-cols-1 gap-6">
            {/* Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointments Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-700">Appt No.</th>
                        <th className="p-3 font-semibold text-gray-700">Patient</th>
                        <th className="p-3 font-semibold text-gray-700">Doctor</th>
                        <th className="p-3 font-semibold text-gray-700">Department</th>
                        <th className="p-3 font-semibold text-gray-700">Time</th>
                        <th className="p-3 font-semibold text-gray-700">Type</th>
                        <th className="p-3 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.appointments.length === 0 ? (
                        <tr><td colSpan={7} className="p-4 text-center text-gray-500">No appointments recorded for this day</td></tr>
                      ) : data.appointments.map((a: any) => (
                        <tr key={a.number} className="border-b hover:bg-gray-50/50">
                          <td className="p-3 font-medium text-gray-900">{a.number}</td>
                          <td className="p-3 text-gray-800">{a.patient}</td>
                          <td className="p-3 text-gray-600">{a.doctor}</td>
                          <td className="p-3 text-gray-600">{a.department}</td>
                          <td className="p-3 text-gray-600">{a.time}</td>
                          <td className="p-3 text-gray-600 capitalize">{a.type}</td>
                          <td className="p-3"><Badge variant={a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'destructive' : 'secondary'}>{a.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Admissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Admissions Today</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-3 font-semibold text-gray-700">Adm No.</th>
                          <th className="p-3 font-semibold text-gray-700">Patient</th>
                          <th className="p-3 font-semibold text-gray-700">Ward/Bed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.admissions.length === 0 ? (
                          <tr><td colSpan={3} className="p-4 text-center text-gray-500">No admissions today</td></tr>
                        ) : data.admissions.map((a: any) => (
                          <tr key={a.number} className="border-b">
                            <td className="p-3 font-medium">{a.number}</td>
                            <td className="p-3">{a.patient}</td>
                            <td className="p-3">{a.ward} (Bed: {a.bed})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Discharges Today</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="p-3 font-semibold text-gray-700">Adm No.</th>
                          <th className="p-3 font-semibold text-gray-700">Patient</th>
                          <th className="p-3 font-semibold text-gray-700">Ward</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.discharges.length === 0 ? (
                          <tr><td colSpan={3} className="p-4 text-center text-gray-500">No discharges today</td></tr>
                        ) : data.discharges.map((d: any) => (
                          <tr key={d.number} className="border-b">
                            <td className="p-3 font-medium">{d.number}</td>
                            <td className="p-3">{d.patient}</td>
                            <td className="p-3">{d.ward}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoices */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Invoices & Collections</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-700">Invoice No.</th>
                        <th className="p-3 font-semibold text-gray-700">Total Amt</th>
                        <th className="p-3 font-semibold text-gray-700">Paid Amt</th>
                        <th className="p-3 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No invoices today</td></tr>
                      ) : data.invoices.map((inv: any) => (
                        <tr key={inv.number} className="border-b">
                          <td className="p-3 font-medium">{inv.number}</td>
                          <td className="p-3 font-semibold">₹{inv.total.toLocaleString()}</td>
                          <td className="p-3 text-green-600 font-semibold">₹{inv.paid.toLocaleString()}</td>
                          <td className="p-3"><Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'destructive'}>{inv.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
