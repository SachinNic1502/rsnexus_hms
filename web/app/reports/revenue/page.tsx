"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, TrendingUp, DollarSign, Wallet, CreditCard, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function RevenueReportPage() {
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
      const res = await fetch(`/api/reports?type=revenue&month=${month}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast('Failed to fetch revenue report', 'error')
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
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
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
          {/* Metrics summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Invoiced Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{data.summary.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">From {data.summary.totalInvoices} generated invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Actual Collections</CardTitle>
                <Wallet className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{data.summary.totalCollected.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.paidInvoices} fully paid invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase">Outstanding Receivables</CardTitle>
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">₹{data.summary.pendingAmount.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">{data.summary.pendingInvoices} invoices with outstanding due</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Revenue by Billing Category</CardTitle></CardHeader>
              <CardContent>
                {data.byCategory.length > 0 && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenue by Category (Invoiced Amount)</p>
                    <svg viewBox="0 0 400 160" className="w-full h-40">
                      <line x1="40" y1="120" x2="380" y2="120" stroke="#e2e8f0" strokeWidth="1.5" />
                      <line x1="40" y1="70" x2="380" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="40" y1="20" x2="380" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />

                      {data.byCategory.map((cat: any, idx: number) => {
                        const maxVal = Math.max(...data.byCategory.map((c: any) => c.amount), 1)
                        const barHeight = (cat.amount / maxVal) * 90
                        const xOffset = 60 + idx * 75

                        return (
                          <g key={cat.category}>
                            <rect
                              x={xOffset}
                              y={120 - barHeight}
                              width="28"
                              height={barHeight}
                              fill="#4f46e5"
                              rx="3"
                            />
                            <text x={xOffset + 14} y="135" textAnchor="middle" className="text-[10px] fill-gray-500 capitalize font-medium">{cat.category}</text>
                            <text x={xOffset + 14} y={115 - barHeight} textAnchor="middle" className="text-[9px] font-bold fill-indigo-600">₹{cat.amount >= 1000 ? `${(cat.amount / 1000).toFixed(1)}k` : cat.amount}</text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-700">Category</th>
                        <th className="p-3 font-semibold text-gray-700 text-center">Items Count</th>
                        <th className="p-3 font-semibold text-gray-700 text-right">Invoiced Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byCategory.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">No transactions categorized</td></tr>
                      ) : data.byCategory.map((cat: any) => (
                        <tr key={cat.category} className="border-b">
                          <td className="p-3 font-medium capitalize">{cat.category}</td>
                          <td className="p-3 text-center text-gray-600">{cat.count}</td>
                          <td className="p-3 text-right font-semibold text-gray-900">₹{cat.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Collections by Payment Method</CardTitle></CardHeader>
              <CardContent>
                {data.byPaymentMethod.length > 0 && (
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Collections breakdown (Payment Method)</p>
                    <div className="space-y-3">
                      {data.byPaymentMethod.map((method: any) => {
                        const maxVal = Math.max(...data.byPaymentMethod.map((m: any) => m.amount), 1)
                        const percent = (method.amount / maxVal) * 100
                        return (
                          <div key={method.method} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="capitalize">{method.method.replace('_', ' ')}</span>
                              <span className="font-semibold text-indigo-600">₹{method.amount.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-3 font-semibold text-gray-700">Method</th>
                        <th className="p-3 font-semibold text-gray-700 text-center">Tx Count</th>
                        <th className="p-3 font-semibold text-gray-700 text-right">Amount Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byPaymentMethod.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">No payment records found</td></tr>
                      ) : data.byPaymentMethod.map((pay: any) => (
                        <tr key={pay.method} className="border-b">
                          <td className="p-3 font-medium uppercase">{pay.method.replace('_', ' ')}</td>
                          <td className="p-3 text-center text-gray-600">{pay.count}</td>
                          <td className="p-3 text-right font-semibold text-green-600">₹{pay.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Billing Patients */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Top Billing Patient Records</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 font-semibold text-gray-700">Patient Name</th>
                      <th className="p-3 font-semibold text-gray-700 text-center">Invoices count</th>
                      <th className="p-3 font-semibold text-gray-700 text-right">Total Billings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPatients.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-500">No patient invoice history</td></tr>
                    ) : data.topPatients.map((pat: any) => (
                      <tr key={pat.patientId} className="border-b hover:bg-gray-50/50">
                        <td className="p-3 font-medium text-blue-600"><Link href={`/patients/${pat.patientId}`}>{pat.name}</Link></td>
                        <td className="p-3 text-center text-gray-600">{pat.invoices}</td>
                        <td className="p-3 text-right font-bold text-gray-900">₹{pat.total.toLocaleString()}</td>
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
