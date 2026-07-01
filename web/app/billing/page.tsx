"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, Loader2, AlertCircle, Printer, ArrowLeft, FileText, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
  type: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  total: number
  status: string
  createdAt: string
  patient: { name: string; uhid: string; mobile?: string }
  items: InvoiceItem[]
  payments: { amount: number; method: string }[]
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const filterPatientId = searchParams.get('patientId')
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchInvoices() }, [filterStatus, filterPatientId])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterPatientId) params.set('patientId', filterPatientId)
      const res = await fetch(`/api/invoices?${params}`)
      if (res.ok) { const data = await res.json(); setInvoices(Array.isArray(data) ? data : []) }
    } catch (error) { toast('Failed to fetch invoices', 'error') }
    finally { setLoading(false) }
  }

  const filteredPatient = invoices.length > 0 ? invoices[0].patient : null

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          {filterPatientId && (
            <Link href="/billing">
              <Button variant="ghost" className="mb-2 -ml-2"><ArrowLeft className="mr-2 h-4 w-4" /> All Invoices</Button>
            </Link>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          {filteredPatient ? (
            <p className="text-gray-600 mt-1">Showing bills for <span className="font-medium text-gray-900">{filteredPatient.name}</span> ({filteredPatient.uhid})</p>
          ) : (
            <p className="text-gray-600 mt-1">Manage invoices and payments</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/billing/pending"><Button variant="outline"><AlertCircle className="mr-2 h-4 w-4" />Pending Payments</Button></Link>
          <Link href="/billing/new"><Button><Plus className="mr-2 h-4 w-4" />New Invoice</Button></Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'partial', 'paid'].map((s) => (
          <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid gap-4">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{filterPatientId ? 'No invoices found for this patient' : 'No invoices found'}</p>
              <Link href="/billing/new">
                <Button className="mt-4" size="sm">New Invoice</Button>
              </Link>
            </div>
          ) : invoices.map((inv) => {
            const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
            const remaining = inv.total - paid
            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-full bg-orange-100 mt-1"><DollarSign className="h-6 w-6 text-orange-600" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{inv.patient.name}</h3>
                          <Badge variant="secondary">{inv.invoiceNumber}</Badge>
                          <Badge variant="outline">{inv.type}</Badge>
                          <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'destructive'}>
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                          <span>{inv.patient.uhid}</span>
                          {inv.patient.mobile && <span>{inv.patient.mobile}</span>}
                          <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                        </div>
                        {inv.items.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {inv.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">{item.type}</Badge>
                                  <span>{item.description}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span>Qty: {item.quantity}</span>
                                  <span>₹{item.unitPrice}</span>
                                  <span className="font-medium">₹{item.total.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-6 mt-2 text-sm">
                          <span className="font-semibold">Total: ₹{inv.total.toLocaleString()}</span>
                          {paid > 0 && <span className="text-green-600">Paid: ₹{paid.toLocaleString()}</span>}
                          {remaining > 0 && <span className="text-red-600">Due: ₹{remaining.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex gap-1">
                        {inv.status !== 'paid' && (
                          <Link href={`/billing/${inv.id}/payment`}>
                            <Button size="sm">Pay</Button>
                          </Link>
                        )}
                        <Link href={`/billing/${inv.id}/receipt`}>
                          <Button size="sm" variant="outline"><FileText className="h-4 w-4" /></Button>
                        </Link>
                      </div>
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
