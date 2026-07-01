"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function NewLabOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [tests, setTests] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([])
  const [doctorId, setDoctorId] = useState('')

  useEffect(() => {
    fetch('/api/lab-tests').then(r => r.json()).then(d => setTests(Array.isArray(d) ? d : []))
    fetch('/api/doctors').then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      fetch(`/api/patients?search=${patientSearch}&searchType=uhid`).then(r => r.json()).then(d => setPatientResults(Array.isArray(d) ? d : []))
    } else { setPatientResults([]) }
  }, [patientSearch])

  const selectPatient = (p: any) => { setSelectedPatient(p); setPatientSearch(p.uhid); setPatientResults([]) }

  const toggleTest = (id: string) => {
    setSelectedTestIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const total = tests.filter(t => selectedTestIds.includes(t.id)).reduce((sum, t) => sum + t.price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) { setError('Please select a patient'); return }
    if (selectedTestIds.length === 0) { setError('Please select at least one test'); return }
    if (!doctorId) { setError('Please select a doctor'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: selectedPatient.id, doctorId, testIds: selectedTestIds }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create order') }
      const order = await res.json()
      toast(`Lab order created! Order #: ${order.orderNumber}`, 'success')
      router.push('/lab')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/lab"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Lab</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">New Lab Order</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Ordering Doctor *</label>
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select Doctor</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.user.name}</option>)}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Select Tests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tests.map((test: any) => (
                  <label key={test.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTestIds.includes(test.id) ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedTestIds.includes(test.id)} onChange={() => toggleTest(test.id)} className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{test.name}</p>
                      <p className="text-xs text-gray-500">{test.category}</p>
                    </div>
                    <p className="font-medium text-sm">₹{test.price}</p>
                  </label>
                ))}
              </div>
              {selectedTestIds.length > 0 && <p className="text-right mt-3 font-bold">Total: ₹{total}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/lab"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={loading || !selectedPatient}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Place Order
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}