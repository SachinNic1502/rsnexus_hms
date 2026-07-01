"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Edit, CheckCircle, XCircle, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Doctor {
  id: string; specialization: string; qualification: string; available: boolean
  user: { id: string; name: string; email: string }
  department: { name: string }
}

export default function DoctorsPage() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [spec, setSpec] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDoctors() }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try { const r = await fetch('/api/doctors'); if (r.ok) { const data = await r.json(); setDoctors(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const toggleAvailability = async (doc: Doctor) => {
    try {
      const r = await fetch(`/api/doctors/${doc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !doc.available, specialization: doc.specialization }),
      })
      if (r.ok) { toast(`Dr. ${doc.user.name} is now ${!doc.available ? 'available' : 'unavailable'}`, 'success'); fetchDoctors() }
    } catch (e) { toast('Error', 'error') }
  }

  const updateSpecialization = async () => {
    if (!editing || !spec) return
    setSaving(true)
    try {
      const r = await fetch(`/api/doctors/${editing.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialization: spec, available: editing.available }),
      })
      if (r.ok) { toast('Specialization updated', 'success'); setEditing(null); fetchDoctors() }
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/settings"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
        <p className="text-gray-600 mt-1">Manage doctor availability and specializations</p>
      </div>

      {editing && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Edit Dr. {editing.user.name}</span>
              <input value={spec} onChange={e => setSpec(e.target.value)} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-64" placeholder="Specialization" />
              <Button size="sm" onClick={updateSpecialization} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : doctors.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {doctors.map(doc => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Dr. {doc.user.name}</h3>
                    <p className="text-sm text-gray-600">{doc.department.name}</p>
                    <p className="text-sm text-gray-500">{doc.specialization}</p>
                    <p className="text-xs text-gray-400">{doc.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.available ? 'default' : 'destructive'}>
                      {doc.available ? 'Available' : 'Unavailable'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(doc); setSpec(doc.specialization) }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleAvailability(doc)}>
                      {doc.available ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
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
