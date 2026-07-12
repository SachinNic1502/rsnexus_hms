"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, FileText, Pill, Calendar, Loader2, User, Eye } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'
import { RoleGuard } from '@/components/role-guard'

interface PrescriptionList {
  id: string
  createdAt: string
  status: string
  patient: { name: string; uhid: string }
  doctor: { user: { name: string }; specialization: string }
  medicines: { medicineName: string }[]
}

export default function PrescriptionsPage() {
  const { user, hasRole } = useAuth()
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<PrescriptionList[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPrescriptions() }, [])

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch('/api/prescriptions')
      if (res.ok) setPrescriptions(await res.json())
    } catch {
      toast('Failed to fetch prescriptions', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = prescriptions.filter(p =>
    !search || p.patient.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient.uhid.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor.user.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'pharmacist', 'nurse']}>
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-gray-600 mt-1">View all prescribed medications</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, UHID, or doctor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{search ? 'No prescriptions match your search' : 'No prescriptions yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{p.patient.name}</p>
                      <p className="text-sm text-gray-600">UHID: {p.patient.uhid}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Dr. {p.doctor.user.name}</span>
                        <span className="flex items-center gap-1"><Pill className="h-3.5 w-3.5" /> {p.medicines.length} medicine{p.medicines.length !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
                        <Badge variant={p.status === 'dispensed' ? 'success' : 'secondary'} className="capitalize">{p.status || 'pending'}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role === 'pharmacist' && p.status !== 'dispensed' && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/prescriptions/${p.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'dispensed' }),
                            })
                            if (!res.ok) throw new Error('Failed to dispense prescription')
                            toast('Prescription dispensed successfully!', 'success')
                            fetchPrescriptions()
                          } catch (err: any) {
                            toast(err.message, 'error')
                          }
                        }}
                      >
                        Dispense
                      </Button>
                    )}
                    <Link href={`/prescriptions/${p.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" /> View
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
    </RoleGuard>
  )
}
