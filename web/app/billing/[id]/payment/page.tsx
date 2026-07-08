"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, Loader2, IndianRupee, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  patient: { name: string; uhid: string; mobile: string }
  items: { description: string; quantity: number; unitPrice: number; total: number; type: string }[]
  payments: { id: string; amount: number; method: string; paidAt: string; transactionId: string }[]
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'insurance', label: 'Insurance' },
]

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('cash')
  const [transactionId, setTransactionId] = useState('')

  // Insurance State Fields
  const [insuranceProvider, setInsuranceProvider] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [preAuthId, setPreAuthId] = useState('')

  useEffect(() => { fetchInvoice() }, [params.id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error('Invoice not found')
      const inv = await res.json()
      setInvoice(inv)
      const paid = inv.payments.reduce((s: number, p: any) => s + p.amount, 0)
      setAmount(inv.total - paid)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice || amount <= 0) return
    setError('')
    setProcessing(true)
    try {
      let finalTransactionId = transactionId
      if (method === 'insurance') {
        finalTransactionId = `Provider: ${insuranceProvider}, Policy: ${policyNumber}, PreAuth: ${preAuthId}`
      }
      const res = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, transactionId: finalTransactionId || undefined, receivedBy: 'System' }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Payment failed')
      }
      setSuccess(true)
      setTimeout(() => router.push('/billing'), 2000)
    } catch (err: any) { setError(err.message) }
    finally { setProcessing(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const remaining = invoice.total - paid

  if (success) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="text-gray-600 mt-2">Redirecting to billing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/billing">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Process Payment</h1>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Payment Form */}
        <div className="col-span-3">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setMethod(pm.value)}
                        className={`p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                          method === pm.value
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remaining}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setAmount(remaining)}>Pay Full (₹{remaining.toLocaleString()})</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setAmount(remaining / 2)}>Pay Half</Button>
                  </div>
                </div>

                {(method === 'card' || method === 'upi' || method === 'bank_transfer') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transaction ID</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                )}

                {method === 'insurance' && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700">Insurance Claim Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Insurance Provider *</label>
                        <input
                          type="text"
                          required
                          value={insuranceProvider}
                          onChange={(e) => setInsuranceProvider(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="e.g. Star Health"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-medium">Policy Number *</label>
                        <input
                          type="text"
                          required
                          value={policyNumber}
                          onChange={(e) => setPolicyNumber(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="e.g. POL123456"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-medium">Pre-Authorization ID / Claim Ref *</label>
                      <input
                        type="text"
                        required
                        value={preAuthId}
                        onChange={(e) => setPreAuthId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="e.g. AUTH-987654"
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={processing || amount <= 0}>
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
                  Process Payment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Summary */}
        <div className="col-span-2">
          <Card>
            <CardHeader><CardTitle>Invoice Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between"><span className="text-gray-600">Invoice #</span><span className="font-medium">{invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Patient</span><span className="font-medium">{invoice.patient.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">UHID</span><span className="font-medium">{invoice.patient.uhid}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Type</span><Badge variant="outline">{invoice.type}</Badge></div>
              <hr />
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{invoice.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Tax</span><span>₹{invoice.tax.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Discount</span><span>-₹{invoice.discount.toLocaleString()}</span></div>
              <hr />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{invoice.total.toLocaleString()}</span></div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>₹{paid.toLocaleString()}</span></div>
              <div className="flex justify-between text-red-600 font-bold"><span>Remaining</span><span>₹{remaining.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div>
                        <p className="font-medium">₹{p.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 capitalize">{p.method.replace('_', ' ')}</p>
                      </div>
                      <p className="text-xs text-gray-500">{new Date(p.paidAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
