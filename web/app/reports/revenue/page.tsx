"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'
import { useToast } from '@/components/ui/toast'

interface RevenueReport {
  month: string
  summary: {
    totalRevenue: number
    totalCollected: number
    pendingAmount: number
    totalInvoices: number
    paidInvoices: number
    pendingInvoices: number
  }
  byType: { opd: { count: number; total: number }; ipd: { count: number; total: number } }
  byCategory: { category: string; amount: number; count: number }[]
  byPaymentMethod: { method: string; amount: number; count: number }[]
  dailyRevenue: { date: string; revenue: number; collected: number }[]
  topPatients: { name: string; total: number; invoices: number }[]
}

export default function RevenueReportPage() {
  const { toast } = useToast()
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { fetchReport() }, [month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?type=revenue&month=${month}`)
      if (res.ok) setReport(await res.json())
    } catch { toast('Failed to fetch report', 'error') }
    finally { setLoading(false) }
  }

  const handleExportExcel = () => {
    if (!report) return
    const data: any[] = [
      { Category: 'Total Revenue', Amount: report.summary.totalRevenue },
      { Category: 'Total Collected', Amount: report.summary.totalCollected },
      { Category: 'Pending', Amount: report.summary.pendingAmount },
      { Category: '---', Amount: '---' },
      { Category: 'OPD Invoices', Amount: report.byType.opd.total },
      { Category: 'IPD Invoices', Amount: report.byType.ipd.total },
      { Category: '---', Amount: '---' },
      ...report.byCategory.map((c) => ({ Category: c.category, Amount: c.amount })),
      { Category: '---', Amount: '---' },
      ...report.byPaymentMethod.map((p) => ({ Category: p.method, Amount: p.amount })),
    ]
    exportToExcel(data, `revenue-report-${month}`)
  }

  const handleExportPDF = () => {
    if (!report) return
    const headers = ['Category', 'Amount']
    const rows = [
      ['Total Revenue', `₹${report.summary.totalRevenue.toLocaleString()}`],
      ['Collected', `₹${report.summary.totalCollected.toLocaleString()}`],
      ['Pending', `₹${report.summary.pendingAmount.toLocaleString()}`],
      ['OPD', `₹${report.byType.opd.total.toLocaleString()}`],
      ['IPD', `₹${report.byType.ipd.total.toLocaleString()}`],
    ]
    report.byCategory.forEach((c) => rows.push([c.category, `₹${c.amount.toLocaleString()}`]))
    exportToPDF(`Revenue Report - ${month}`, headers, rows, `revenue-report-${month}`)
  }

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash', card: 'Card', upi: 'UPI', bank_transfer: 'Bank Transfer', insurance: 'Insurance',
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
            <h1 className="text-3xl font-bold text-gray-900">Revenue Report</h1>
            <p className="text-gray-600 mt-1">Revenue analytics and breakdown</p>
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
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[
              { label: 'Total Revenue', value: `₹${report.summary.totalRevenue.toLocaleString()}`, color: 'text-green-600' },
              { label: 'Collected', value: `₹${report.summary.totalCollected.toLocaleString()}`, color: 'text-blue-600' },
              { label: 'Pending', value: `₹${report.summary.pendingAmount.toLocaleString()}`, color: 'text-red-600' },
              { label: 'Total Invoices', value: report.summary.totalInvoices, color: '' },
              { label: 'Paid', value: report.summary.paidInvoices, color: 'text-green-600' },
              { label: 'Unpaid', value: report.summary.pendingInvoices, color: 'text-orange-600' },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* By Type */}
            <Card>
              <CardHeader><CardTitle>Revenue by Type</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">OPD ({report.byType.opd.count} invoices)</p>
                  <p className="text-xl font-bold text-blue-600">₹{report.byType.opd.total.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded">
                  <p className="text-sm text-gray-600">IPD ({report.byType.ipd.count} invoices)</p>
                  <p className="text-xl font-bold text-purple-600">₹{report.byType.ipd.total.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* By Category */}
            <Card>
              <CardHeader><CardTitle>Revenue by Category</CardTitle></CardHeader>
              <CardContent>
                {report.byCategory.length > 0 ? (
                  <div className="space-y-2">
                    {report.byCategory.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{c.category}</span>
                        <span className="font-medium">₹{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No data</p>
                )}
              </CardContent>
            </Card>

            {/* By Payment Method */}
            <Card>
              <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
              <CardContent>
                {report.byPaymentMethod.length > 0 ? (
                  <div className="space-y-2">
                    {report.byPaymentMethod.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{paymentMethodLabels[p.method] || p.method}</span>
                        <span className="font-medium">₹{p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No payments recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Patients */}
          {report.topPatients.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top Paying Patients</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Patient</th>
                      <th className="text-right p-2">Invoices</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topPatients.map((p, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2 text-right">{p.invoices}</td>
                        <td className="p-2 text-right font-medium">₹{p.total.toLocaleString()}</td>
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
