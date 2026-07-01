"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  total: number
  status: string
  createdAt: string
  patient: { name: string; uhid: string; mobile: string }
  payments: { amount: number; method: string }[]
}

export default function PendingPaymentsPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPending() }, [])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const [pending, partial] = await Promise.all([
        fetch('/api/invoices?status=pending').then(r => r.json()),
        fetch('/api/invoices?status=partial').then(r => r.json()),
      ])
      const pendingArr = Array.isArray(pending) ? pending : []
      const partialArr = Array.isArray(partial) ? partial : []
      setInvoices([...pendingArr, ...partialArr].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    } catch (e) { toast('Failed to fetch pending invoices', 'error') }
    finally { setLoading(false) }
  }

  const totalPending = invoices.reduce((s, inv) => {
    const paid = inv.payments.reduce((ps, p) => ps + p.amount, 0)
    return s + (inv.total - paid)
  }, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/billing">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Payments</h1>
            <p className="text-gray-600 mt-1">Invoices with outstanding balances</p>
          </div>
          <Card className="px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Total Outstanding</p>
                <p className="text-xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">No pending payments. All invoices are paid!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((inv) => {
            const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
            const remaining = inv.total - paid
            const daysOld = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-red-100">
                        <DollarSign className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{inv.patient.name}</h3>
                          <Badge variant="secondary">{inv.invoiceNumber}</Badge>
                          <Badge variant="outline">{inv.type}</Badge>
                          {daysOld > 30 && <Badge variant="destructive">Overdue ({daysOld}d)</Badge>}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>{inv.patient.uhid}</span>
                          <span>{inv.patient.mobile}</span>
                          <span>Total: ₹{inv.total.toLocaleString()}</span>
                          <span className="text-green-600">Paid: ₹{paid.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">₹{remaining.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mb-2">Outstanding</p>
                      <Link href={`/billing/${inv.id}/payment`}>
                        <Button size="sm">Pay Now</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
