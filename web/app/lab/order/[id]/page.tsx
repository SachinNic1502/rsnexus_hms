"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, TestTube, Loader2, ClipboardCheck, Play, Printer, User, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'

interface Test {
  id: string
  testName: string
  price: number
}

interface LabOrder {
  id: string
  orderNumber: string
  status: 'pending' | 'in_progress' | 'completed'
  orderedAt: string
  completedAt: string | null
  patient: { name: string; uhid: string; gender: string; age: number | null }
  doctor: { user: { name: string }; specialization: string }
  tests: Test[]
  report: { id: string; results: Record<string, string>; uploadedBy: string; uploadedAt: string } | null
}

export default function LabOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [order, setOrder] = useState<LabOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/lab-orders/${params.id}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
      // Initialize results with empty strings or existing values
      const initialResults: Record<string, string> = {}
      data.tests.forEach((t: Test) => {
        initialResults[t.testName] = data.report?.results?.[t.testName] || ''
      })
      setResults(initialResults)
    } catch {
      toast('Failed to fetch lab order details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startProcessing = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/lab-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast('Order is now in progress', 'success')
      fetchOrder()
    } catch (err: any) {
      toast(err.message || 'Error updating order status', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault()
    // Verify all tests have results filled
    const missing = order?.tests.some(t => !results[t.testName]?.trim())
    if (missing) {
      alert('Please fill in results for all tests.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/lab-orders/${params.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          uploadedBy: user?.name || 'Lab Technician',
        }),
      })
      if (!res.ok) throw new Error('Failed to submit results')
      toast('Results submitted and order completed successfully!', 'success')
      fetchOrder()
    } catch (err: any) {
      toast(err.message || 'Error submitting results', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return <div className="p-8 text-center text-red-500">Lab order not found</div>
  }

  return (
    <div className="p-8">
      {/* Navigation & Controls */}
      <div className="mb-6 no-print flex items-center justify-between print:hidden">
        <Link href="/lab">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lab Orders
          </Button>
        </Link>
        {order.status === 'completed' && (
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
        )}
      </div>

      {/* Main Order Detail Grid */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <TestTube className="h-6 w-6 text-blue-600" />
                Lab Order Details
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Order ID: {order.orderNumber}</p>
            </div>
            <Badge variant={order.status === 'completed' ? 'success' : order.status === 'in_progress' ? 'warning' : 'secondary'}>
              {order.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Info */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-4 w-4" /> Patient Info
                </h3>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-600 font-medium">Name:</span> {order.patient.name}</p>
                  <p><span className="text-gray-600 font-medium">UHID:</span> {order.patient.uhid}</p>
                  <p><span className="text-gray-600 font-medium">Gender/Age:</span> {order.patient.gender}, {order.patient.age || 'N/A'} years</p>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Stethoscope className="h-4 w-4" /> Doctor & Timing
                </h3>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-gray-600 font-medium">Doctor:</span> Dr. {order.doctor.user.name}</p>
                  <p><span className="text-gray-600 font-medium">Specialization:</span> {order.doctor.specialization}</p>
                  <p><span className="text-gray-600 font-medium">Ordered Date:</span> {new Date(order.orderedAt).toLocaleString()}</p>
                  {order.completedAt && (
                    <p><span className="text-gray-600 font-medium">Completed Date:</span> {new Date(order.completedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel / Result Form */}
        <Card className="no-print print:shadow-none print:border-t">
          <CardHeader>
            <CardTitle>
              {order.status === 'completed' ? 'Test Results' : 'Order Processing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === 'pending' && (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4 font-medium">This order is ready to be processed.</p>
                <Button onClick={startProcessing} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Start Processing (In Progress)
                </Button>
              </div>
            )}

            {order.status === 'in_progress' && (
              <form onSubmit={handleSubmitResults} className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Please input findings and values for each test below:</p>
                <div className="space-y-4">
                  {order.tests.map((t) => (
                    <div key={t.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-3 last:border-0 last:pb-0">
                      <div className="md:col-span-1">
                        <label className="font-semibold text-sm text-gray-700">{t.testName}</label>
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Enter findings / values (e.g. 14.5 g/dL)"
                          value={results[t.testName] || ''}
                          onChange={(e) => setResults({ ...results, [t.testName]: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCheck className="h-4 w-4 mr-2" />}
                    Submit Results & Complete
                  </Button>
                </div>
              </form>
            )}

            {order.status === 'completed' && order.report && (
              <div className="space-y-6">
                <table className="w-full text-sm text-left border-collapse border">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-3 border">Test Name</th>
                      <th className="p-3 border">Result Findings / Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tests.map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="p-3 border font-semibold text-gray-700">{t.testName}</td>
                        <td className="p-3 border text-gray-900 bg-blue-50/50">{order.report?.results?.[t.testName] || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Uploaded By:</span> {order.report.uploadedBy}</p>
                  <p><span className="font-medium">Uploaded At:</span> {new Date(order.report.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
