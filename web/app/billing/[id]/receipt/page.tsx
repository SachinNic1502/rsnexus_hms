"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import { Receipt } from '@/components/receipt'
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

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found</div>

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          .no-print { display: none !important; }
          .print-wrapper { box-shadow: none !important; border: none !important; margin: 0 !important; }
        }
      `}</style>
      <div className="min-h-screen" style={{ background: '#f1f5f9' }}>
        <div className="no-print" style={{ maxWidth: '210mm', margin: '0 auto', padding: '20px 16px 0' }}>
          <Link href="/billing">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing
            </Button>
          </Link>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receipt</h1>
              <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
            </div>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Receipt
            </Button>
          </div>
        </div>

        <div className="print-wrapper" style={{ maxWidth: '210mm', margin: '0 auto 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
          <Receipt invoice={invoice} />
        </div>
      </div>
    </>
  )
}
