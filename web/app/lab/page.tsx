"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TestTube, Loader2, FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface LabOrder {
  id: string
  orderNumber: string
  status: string
  orderedAt: string
  patient: { name: string; uhid: string }
  doctor: { user: { name: string } }
  tests: { testName: string }[]
  report: { id: string } | null
}

export default function LabPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchOrders() }, [filterStatus])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const res = await fetch(`/api/lab-orders?${params}`)
      if (res.ok) { const data = await res.json(); setOrders(Array.isArray(data) ? data : []) }
    } catch { toast('Failed to fetch lab orders', 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
          <p className="text-gray-600 mt-1">Manage lab test orders and reports</p>
        </div>
        <Link href="/lab/order"><Button><Plus className="mr-2 h-4 w-4" />New Order</Button></Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'in_progress', 'completed'].map((s) => (
          <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No lab orders found</p>
              <Link href="/lab/order">
                <Button className="mt-4" size="sm">New Order</Button>
              </Link>
            </div>
          ) : orders.map((o) => (
            <Card key={o.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100"><TestTube className="h-6 w-6 text-purple-600" /></div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{o.patient.name}</h3>
                        <Badge variant="secondary">{o.orderNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{o.patient.uhid}</span>
                        <span>Dr. {o.doctor.user.name}</span>
                        <span>{o.tests.map((t) => t.testName).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge variant={o.status === 'completed' ? 'success' : o.status === 'in_progress' ? 'warning' : 'secondary'}>
                      {o.status.replace('_', ' ')}
                    </Badge>
                    <Link href={`/lab/order/${o.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
