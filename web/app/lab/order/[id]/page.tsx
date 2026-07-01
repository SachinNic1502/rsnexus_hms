"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

export default function LabOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => { fetchOrder() }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/lab-orders/${params.id}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
      setResults(data.tests?.map((t: any) => ({ testId: t.labTestId, testName: t.testName, result: '', normalRange: '', isAbnormal: false })) || [])
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const updateResult = (i: number, field: string, value: any) => {
    const newResults = [...results]
    ;(newResults as any)[i][field] = value
    setResults(newResults)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasEmpty = results.some((r: any) => !r.result.trim())
    if (hasEmpty) { setError('All test results are required'); return }
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/lab-orders/${params.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, uploadedBy: 'Lab Technician' }),
      })
      if (!res.ok) throw new Error('Failed to upload report')
      toast('Lab report uploaded successfully!', 'success')
      router.push('/lab')
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/lab"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Lab</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Lab Order Details</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{order.patient.name}</h3>
                <Badge variant="secondary">{order.orderNumber}</Badge>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">{order.patient.uhid} | Dr. {order.doctor.user.name}</p>
            </div>
            <p className="text-sm text-gray-600">{new Date(order.orderedAt).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {order.report ? (
        <Card>
          <CardHeader><CardTitle>Report Results</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.report.results?.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border">
                  <p className="font-medium">{r.testName}</p>
                  <p className="text-sm">Result: {r.result} {r.normalRange && `(Normal: ${r.normalRange})`}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Enter Test Results</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {results.map((r: any, i: number) => (
                <div key={i} className="p-4 rounded-lg border space-y-3">
                  <p className="font-medium">{r.testName}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-xs font-medium">Result *</label><Input value={r.result} onChange={e => updateResult(i, 'result', e.target.value)} placeholder="Enter result" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Normal Range</label><Input value={r.normalRange} onChange={e => updateResult(i, 'normalRange', e.target.value)} placeholder="e.g. 70-100" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Abnormal?</label><label className="flex items-center gap-2 mt-1"><input type="checkbox" checked={r.isAbnormal} onChange={e => updateResult(i, 'isAbnormal', e.target.checked)} className="w-4 h-4" /><span className="text-sm">Flag as abnormal</span></label></div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Upload Report
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
