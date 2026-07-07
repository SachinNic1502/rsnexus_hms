"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Stethoscope, ClipboardCheck, TestTube, FileText } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function DoctorPerformancePage() {
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
      const res = await fetch(`/api/reports?type=doctor-performance&month=${month}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast('Failed to fetch doctor performance report', 'error')
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
          <h1 className="text-3xl font-bold text-gray-900">Doctor Performance Analytics</h1>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clinical Load & Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 font-semibold text-gray-700">Doctor Name</th>
                      <th className="p-3 font-semibold text-gray-700">Department</th>
                      <th className="p-3 font-semibold text-gray-700 text-center">Appointments (Total)</th>
                      <th className="p-3 font-semibold text-gray-700 text-center">Completed</th>
                      <th className="p-3 font-semibold text-gray-700 text-center flex-row items-center gap-1"><ClipboardCheck className="h-3 w-3 inline mr-1" />Consults</th>
                      <th className="p-3 font-semibold text-gray-700 text-center"><TestTube className="h-3 w-3 inline mr-1" />Lab Orders</th>
                      <th className="p-3 font-semibold text-gray-700 text-center"><FileText className="h-3 w-3 inline mr-1" />Prescriptions</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.doctors.length === 0 ? (
                      <tr><td colSpan={8} className="p-4 text-center text-gray-500">No activity recorded for this period</td></tr>
                    ) : data.doctors.map((doc: any) => (
                      <tr key={doc.doctorId} className="border-b hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-900">Dr. {doc.name}</td>
                        <td className="p-3 text-gray-600">{doc.department}</td>
                        <td className="p-3 text-center text-gray-600 font-medium">{doc.totalAppointments}</td>
                        <td className="p-3 text-center text-green-600 font-medium">{doc.completedAppointments}</td>
                        <td className="p-3 text-center text-gray-600">{doc.consultations}</td>
                        <td className="p-3 text-center text-gray-600">{doc.labOrders}</td>
                        <td className="p-3 text-center text-gray-600">{doc.prescriptions}</td>
                        <td className="p-3 text-right font-bold text-blue-600">
                          {doc.completionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
