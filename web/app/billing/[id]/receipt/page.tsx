"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Receipt } from '@/components/receipt'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer, Loader2, Download } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReceiptPage() {
  const params = useParams()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error('Invoice not found')
      setInvoice(await res.json())
    } catch {
      toast('Failed to fetch invoice details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    if (!invoice) return
    const doc = new jsPDF()

    // Title / Logo / Header
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(20)
    doc.text("Rs Nexus Hospital", 14, 20)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(10)
    doc.text("123 Healthcare Boulevard, Tech City", 14, 26)
    doc.text("Phone: +91 98765 43210 | Support: contact@rsnexus.com", 14, 31)
    
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 35, 196, 35)

    // Invoice Meta
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(14)
    doc.text("INVOICE RECEIPT", 14, 45)
    
    doc.setFontSize(10)
    doc.setFont("Helvetica", "normal")
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 52)
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 57)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 62)

    // Patient Details Card
    doc.setFillColor(245, 247, 250)
    doc.rect(120, 40, 76, 26, "F")
    doc.setFont("Helvetica", "bold")
    doc.text("PATIENT DETAILS", 124, 46)
    doc.setFont("Helvetica", "normal")
    doc.text(`Name: ${invoice.patient.name}`, 124, 52)
    doc.text(`UHID: ${invoice.patient.uhid}`, 124, 57)
    doc.text(`Mobile: ${invoice.patient.mobile}`, 124, 62)

    // Invoice Items table
    const tableData = invoice.items.map((item: any, idx: number) => [
      idx + 1,
      item.description,
      item.quantity,
      `INR ${item.unitPrice.toLocaleString()}`,
      `INR ${item.total.toLocaleString()}`
    ])

    autoTable(doc, {
      startY: 72,
      head: [["S.No", "Description", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }
    })

    // Totals Box
    let finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFont("Helvetica", "normal")
    doc.text(`Subtotal: INR ${invoice.subtotal.toLocaleString()}`, 140, finalY)
    doc.text(`Tax / GST: INR ${invoice.tax.toLocaleString()}`, 140, finalY + 5)
    doc.text(`Discount: INR ${invoice.discount.toLocaleString()}`, 140, finalY + 10)
    doc.setFont("Helvetica", "bold")
    doc.text(`Total Amount: INR ${invoice.total.toLocaleString()}`, 140, finalY + 17)

    // Footer note
    doc.setFont("Helvetica", "italic")
    doc.setFontSize(9)
    doc.text("Thank you for choosing Rs Nexus Hospital. This is a computer-generated invoice.", 14, finalY + 30)

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!invoice) {
    return <div className="p-8 text-center text-red-500">Invoice not found</div>
  }

  return (
    <div className="p-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .a4-receipt, .a4-receipt * {
            visibility: visible;
          }
          .a4-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, header, nav, aside, footer {
            display: none !important;
          }
        }
      `}</style>
      {/* Controls - hidden on print */}
      <div className="mb-6 no-print flex items-center justify-between max-w-3xl mx-auto print:hidden">
        <Link href="/billing">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button onClick={handleDownloadPDF} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
        </div>
      </div>

      {/* Printable Receipt Wrapper */}
      <div className="print:p-0 print:m-0 print:shadow-none">
        <Receipt invoice={invoice} />
      </div>
    </div>
  )
}
