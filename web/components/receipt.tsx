"use client"

import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'

interface ReceiptProps {
  invoice: {
    invoiceNumber: string
    type: string
    subtotal: number
    tax: number
    discount: number
    total: number
    createdAt: string
    patient: { name: string; uhid: string }
    items: { description: string; quantity: number; unitPrice: number; total: number }[]
    payments: { amount: number; method: string; paidAt: string }[]
  }
}

export function Receipt({ invoice }: ReceiptProps) {
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="max-w-md mx-auto bg-white p-6 text-sm font-mono">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Building2 className="h-5 w-5" />
          <p className="font-bold text-lg">Rs Nexus HMS</p>
        </div>
        <p className="text-xs text-gray-500">123 Healthcare Avenue</p>
        <p className="text-xs text-gray-500">GSTIN: 22AABCT1234F1Z5</p>
      </div>

      {/* Invoice Info */}
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500">Receipt #</p>
          <p className="font-bold">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Date</p>
          <p>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Patient */}
      <div className="mb-4 border-b border-dashed border-gray-400 pb-4">
        <p className="text-xs text-gray-500">Patient</p>
        <p className="font-medium">{invoice.patient.name}</p>
        <p className="text-xs text-gray-500">UHID: {invoice.patient.uhid}</p>
      </div>

      {/* Items */}
      <div className="mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Rate</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-dashed border-gray-200">
                <td className="py-1">{item.description}</td>
                <td className="text-right py-1">{item.quantity}</td>
                <td className="text-right py-1">₹{item.unitPrice}</td>
                <td className="text-right py-1">₹{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-300 pt-2 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{invoice.subtotal.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>₹{invoice.tax.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>-₹{invoice.discount.toLocaleString()}</span></div>
        <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1"><span>TOTAL</span><span>₹{invoice.total.toLocaleString()}</span></div>
      </div>

      {/* Payment */}
      <div className="border-t border-dashed border-gray-400 mt-4 pt-4">
        <p className="text-xs text-gray-500 mb-2">Payment Details</p>
        <div className="flex justify-between"><span>Amount Paid</span><span className="font-bold">₹{paid.toLocaleString()}</span></div>
        {paid < invoice.total && (
          <div className="flex justify-between text-red-600"><span>Balance Due</span><span className="font-bold">₹{(invoice.total - paid).toLocaleString()}</span></div>
        )}
        {invoice.payments.length > 0 && (
          <div className="mt-2">
            {invoice.payments.map((p, i) => (
              <p key={i} className="text-xs text-gray-500">{p.method.toUpperCase()} - ₹{p.amount.toLocaleString()}</p>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-xs text-gray-400 border-t border-dashed border-gray-400 pt-4">
        <p>Thank you for choosing Rs Nexus HMS</p>
        <p>For queries: billing@rsnexus.com</p>
      </div>
    </div>
  )
}
