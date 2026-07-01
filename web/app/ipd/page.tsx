"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, BedDouble, Loader2, Eye, Bed } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Admission {
  id: string
  admissionNumber: string
  admissionDate: string
  status: string
  patient: { name: string; uhid: string }
  doctor: { user: { name: string } }
  ward: { name: string }
  room: { roomNumber: string }
  bed: { bedNumber: string }
}

export default function IPDPage() {
  const { toast } = useToast()
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchAdmissions()
  }, [filterStatus])

  const fetchAdmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const res = await fetch(`/api/admissions?${params}`)
      if (res.ok) { const data = await res.json(); setAdmissions(Array.isArray(data) ? data : []) }
    } catch (error) {
      toast('Failed to fetch admissions', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IPD Management</h1>
          <p className="text-gray-600 mt-1">In-patient department and bed management</p>
        </div>
        <Link href="/ipd/admit">
          <Button><Plus className="mr-2 h-4 w-4" />New Admission</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'admitted', 'discharged'].map((s) => (
          <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="grid gap-4">
          {admissions.length === 0 ? (
            <div className="text-center py-12">
              <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active admissions</p>
              <Link href="/ipd/admit">
                <Button className="mt-4" size="sm">New Admission</Button>
              </Link>
            </div>
          ) : admissions.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100"><BedDouble className="h-6 w-6 text-green-600" /></div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{a.patient.name}</h3>
                        <Badge variant="secondary">{a.admissionNumber}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>{a.patient.uhid}</span>
                        <span>Dr. {a.doctor.user.name}</span>
                        <span>{a.ward.name} - Room {a.room.roomNumber}, Bed {a.bed.bedNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-2">{new Date(a.admissionDate).toLocaleDateString()}</p>
                    <Badge variant={a.status === 'admitted' ? 'success' : 'secondary'}>{a.status}</Badge>
                    <div className="mt-2">
                      <Link href={`/ipd/${a.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> View</Button></Link>
                    </div>
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
