"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  type: string
}

export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])

  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, type: 'service' }])
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(data => setServices(Array.isArray(data) ? data : [])).catch(() => setServices([])) }, [])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      fetch(`/api/patients?search=${patientSearch}&searchType=uhid`).then(r => r.json()).then(data => setPatientResults(Array.isArray(data) ? data : []))
    } else { setPatientResults([]) }
  }, [patientSearch])

  const selectPatient = (p: any) => { setSelectedPatient(p); setPatientSearch(p.uhid); setPatientResults([]) }

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, type: 'service' }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: any) => {
    const newItems = [...items]
    ;(newItems as any)[i][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const total = subtotal + tax - discount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) { setError('Please select a patient'); return }
    if (items.some(i => !i.description)) { setError('Please fill all item descriptions'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient.id, type: 'OPD', items, tax, discount }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create invoice') }
      const inv = await res.json()
      toast(`Invoice created! Total: ₹${inv.total.toLocaleString()}`, 'success')
      router.push('/billing')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'billing_staff', 'receptionist']}>
      <div className="p-8">
        <div className="mb-8">
          <Link href="/billing"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Billing</Button></Link>
          <h1 className="text-3xl font-bold text-gray-900">New Invoice</h1>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Patient *</label>
                <Input value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }} placeholder="Search by UHID..." required />
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                    {patientResults.map((p: any) => (
                      <div key={p.id} className="p-3 hover:bg-gray-100 cursor-pointer" onClick={() => selectPatient(p)}>
                        <p className="font-medium">{p.name} <span className="text-sm text-gray-500">({p.uhid})</span></p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && <p className="text-sm text-green-600">Selected: {selectedPatient.name}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Add Item</Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="text-xs font-medium">Description</label>
                        <select value={item.description} onChange={e => { updateItem(i, 'description', e.target.value); const svc = services.find((s: any) => s.name === e.target.value); if (svc) { updateItem(i, 'unitPrice', svc.price) } }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Select or type</option>
                          {services.map((s: any) => <option key={s.id} value={s.name}>{s.name} - ₹{s.price}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Qty</label>
                        <Input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Unit Price</label>
                        <Input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium">Total</label>
                        <p className="font-medium h-10 flex items-center">₹{(item.quantity * item.unitPrice).toFixed(2)}</p>
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md ml-auto">
                <div className="space-y-1"><label className="text-sm font-medium">Subtotal</label><p className="font-medium">₹{subtotal.toFixed(2)}</p></div>
                <div className="space-y-1"><label className="text-sm font-medium">Tax (₹)</label><Input type="number" step="0.01" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Discount (₹)</label><Input type="number" step="0.01" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div className="text-right"><p className="text-lg font-bold">Total: ₹{total.toFixed(2)}</p></div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href="/billing"><Button type="button" variant="outline">Cancel</Button></Link>
                <Button type="submit" disabled={loading || !selectedPatient}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Create Invoice
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
