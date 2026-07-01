"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import { Receipt } from '@/components/receipt'
import { exportToPDF } from '@/lib/export-utils'
import { useToast } from '@/components/ui/toast'

interface Invoice {
  id: string
  invoiceNumber: string
  type: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  createdAt: string
  patient: { name: string; uhid: string; mobile: string }
  items: { description: string; quantity: number; unitPrice: number; total: number }[]
  payments: { amount: number; method: string; paidAt: string }[]
}

export default function ReceiptPage() {
  const params = useParams()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInvoice() }, [params.id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error('Invoice not found')
      setInvoice(await res.json())
    } catch { toast('Failed to fetch invoice', 'error') }
    finally { setLoading(false) }
  }

  const handlePrint = () => { window.print() }

  const handleExportPDF = () => {
    if (!invoice) return
    const headers = ['Item', 'Qty', 'Rate', 'Amount']
    const rows = invoice.items.map((item) => [
      item.description, item.quantity, `₹${item.unitPrice}`, `₹${item.total.toLocaleString()}`,
    ])
    rows.push(['', '', 'Subtotal', `₹${invoice.subtotal.toLocaleString()}`])
    rows.push(['', '', 'Tax', `₹${invoice.tax.toLocaleString()}`])
    rows.push(['', '', 'Discount', `-₹${invoice.discount.toLocaleString()}`])
    rows.push(['', '', 'TOTAL', `₹${invoice.total.toLocaleString()}`])
    exportToPDF(`Receipt - ${invoice.invoiceNumber}`, headers, rows, `receipt-${invoice.invoiceNumber}`)
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>

  return (
    <div className="p-8">
      <div className="mb-6 no-print">
        <Link href="/billing">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Receipt</h1>
            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </div>
      </div>

      <Card className="max-w-md mx-auto print:shadow-none print:border-none">
        <CardContent className="p-0">
          <Receipt invoice={invoice} />
        </CardContent>
      </Card>
    </div>
  )
}
