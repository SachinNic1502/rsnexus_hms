"use client"

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

// Friendly labels for stored PaymentMethod enum values (bank_transfer is
// surfaced as "Net Banking" across the app).
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Net Banking',
  insurance: 'Insurance',
}

export function Receipt({ invoice }: ReceiptProps) {
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const balance = invoice.total - paid
  const isPaid = balance <= 0

  return (
    <div className="a4-receipt" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1a1a2e', fontSize: '13px', lineHeight: '1.5' }}>

      {/* === TOP COLOR BAND === */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)', color: '#fff', padding: '28px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '0.5px' }}>Jeevanti Hospitals</h1>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.8, letterSpacing: '0.3px' }}>123 Healthcare Avenue, Medical District</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>GSTIN: 22AABCT1234F1Z5</p>
          <p style={{ margin: 0, fontSize: '11px', opacity: 0.7 }}>Ph: +91 98765 43210</p>
        </div>
      </div>

      {/* === RECEIPT TITLE BAR === */}
      <div style={{ background: '#f0f7ff', borderBottom: '3px solid #2563eb', padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '2px' }}>Payment Receipt</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#92400e', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isPaid ? 'PAID' : 'PENDING'}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 36px' }}>

        {/* === INVOICE INFO + PATIENT === */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          {/* Invoice Details */}
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice Details</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Receipt No.</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{invoice.invoiceNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Type</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{invoice.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Date</span>
              <span style={{ color: '#1e293b' }}>{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Patient Details */}
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '16px 20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient Details</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Name</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{invoice.patient.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>UHID</span>
              <span style={{ color: '#1e293b', fontFamily: 'monospace' }}>{invoice.patient.uhid}</span>
            </div>
          </div>
        </div>

        {/* === ITEMS TABLE === */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Bill Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Item Description</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate (₹)</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f0f7ff', borderBottom: '1px solid #e8edf3' }}>
                  <td style={{ padding: '9px 14px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '9px 14px', color: '#1e293b' }}>{item.description}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', color: '#475569' }}>₹{item.unitPrice.toLocaleString()}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* === TOTALS === */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }} />
          <div style={{ width: '280px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Subtotal</span>
                <span style={{ color: '#1e293b', fontSize: '12px' }}>₹{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Tax (GST)</span>
                <span style={{ color: '#1e293b', fontSize: '12px' }}>₹{invoice.tax.toLocaleString()}</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Discount</span>
                <span style={{ color: '#dc2626', fontSize: '12px' }}>-₹{invoice.discount.toLocaleString()}</span>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: '#fff' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.5px' }}>TOTAL</span>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>₹{invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* === PAYMENT INFO === */}
        <div style={{ background: isPaid ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`, borderRadius: '10px', padding: '16px 20px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: isPaid ? '#166534' : '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Information</h3>
          <div style={{ display: 'flex', gap: '32px', marginBottom: '8px' }}>
            <div>
              <span style={{ color: isPaid ? '#166534' : '#92400e', fontSize: '12px' }}>Amount Paid</span>
              <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '16px', color: isPaid ? '#166534' : '#92400e' }}>₹{paid.toLocaleString()}</p>
            </div>
            {!isPaid && (
              <div>
                <span style={{ color: '#dc2626', fontSize: '12px' }}>Balance Due</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '16px', color: '#dc2626' }}>₹{balance.toLocaleString()}</p>
              </div>
            )}
          </div>
          {invoice.payments.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`, paddingTop: '8px' }}>
              {invoice.payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                  <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{PAYMENT_METHOD_LABELS[p.method] || p.method}</span>
                  <span>₹{p.amount.toLocaleString()} — {new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === FOOTER === */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 4px' }}>This is a computer-generated receipt.</p>
            <p style={{ margin: 0 }}>For queries, contact billing@jeevantihospitals.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ borderTop: '1px solid #94a3b8', width: '160px', paddingTop: '4px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
