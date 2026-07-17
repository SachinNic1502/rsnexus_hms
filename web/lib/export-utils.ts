import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(title, 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  })

  doc.save(`${filename}.pdf`)
}

// ─── Invoice PDF ─────────────────────────────────────────
interface InvoiceForPdf {
  invoiceNumber: string
  type: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  createdAt: string
  dueDate?: string | null
  items?: { description: string; quantity: number; unitPrice: number; total: number }[]
  payments?: { amount: number; method: string; paidAt: string }[]
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Net Banking',
  insurance: 'Insurance',
}

// Download a single invoice as a formatted PDF (used by the "Download Invoice"
// action on the patient profile). Mirrors the on-screen receipt content.
export function exportInvoiceToPDF(
  invoice: InvoiceForPdf,
  patient: { name: string; uhid: string }
) {
  const doc = new jsPDF()
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const paid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0)
  const balance = invoice.total - paid

  doc.setFontSize(18)
  doc.text('Jeevanti Hospitals', 14, 20)
  doc.setFontSize(11)
  doc.text('Invoice / Receipt', 14, 28)

  doc.setFontSize(10)
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 14, 40)
  doc.text(`Type: ${invoice.type}`, 14, 46)
  doc.text(`Invoice Date: ${fmtDate(invoice.createdAt)}`, 14, 52)
  if (invoice.dueDate) doc.text(`Due Date: ${fmtDate(invoice.dueDate)}`, 14, 58)
  doc.text(`Patient: ${patient.name} (${patient.uhid})`, 120, 40)
  doc.text(`Billing Status: ${invoice.status.toUpperCase()}`, 120, 46)
  doc.text(`Payment Status: ${balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}`, 120, 52)

  autoTable(doc, {
    head: [['#', 'Description', 'Qty', 'Rate (Rs)', 'Amount (Rs)']],
    body: (invoice.items || []).map((it, i) => [
      i + 1,
      it.description,
      it.quantity,
      it.unitPrice.toLocaleString('en-IN'),
      it.total.toLocaleString('en-IN'),
    ]),
    startY: 66,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  })

  // @ts-expect-error autotable augments the doc instance with lastAutoTable
  let y = (doc.lastAutoTable?.finalY || 66) + 10
  doc.setFontSize(10)
  doc.text(`Subtotal: Rs ${invoice.subtotal.toLocaleString('en-IN')}`, 140, y); y += 6
  doc.text(`Tax: Rs ${invoice.tax.toLocaleString('en-IN')}`, 140, y); y += 6
  doc.text(`Discount: Rs ${invoice.discount.toLocaleString('en-IN')}`, 140, y); y += 6
  doc.setFontSize(12)
  doc.text(`Total: Rs ${invoice.total.toLocaleString('en-IN')}`, 140, y); y += 8
  doc.setFontSize(10)
  doc.text(`Paid: Rs ${paid.toLocaleString('en-IN')}`, 140, y); y += 6
  doc.text(`Balance: Rs ${balance.toLocaleString('en-IN')}`, 140, y)

  if ((invoice.payments || []).length > 0) {
    autoTable(doc, {
      head: [['Payment Method', 'Amount (Rs)', 'Date']],
      body: (invoice.payments || []).map((p) => [
        PAYMENT_METHOD_LABELS[p.method] || p.method,
        p.amount.toLocaleString('en-IN'),
        fmtDate(p.paidAt),
      ]),
      startY: y + 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    })
  }

  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
}
