"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doctorCreateSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Edit, CheckCircle, XCircle, Stethoscope, Plus } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/dialog'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface Doctor {
  id: string; specialization: string; qualification: string; available: boolean
  user: { id: string; name: string; email: string }
  department: { id: string; name: string }
}

interface Department {
  id: string; name: string
}

type DoctorForm = {
  name: string; email: string; password: string
  departmentId: string; specialization: string; qualification: string
}

export default function DoctorsPage() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [spec, setSpec] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { hasRole } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DoctorForm>({
    resolver: zodResolver(doctorCreateSchema) as unknown as Resolver<DoctorForm>,
    defaultValues: { name: '', email: '', password: '', departmentId: '', specialization: '', qualification: '' },
  })

  useEffect(() => { fetchDoctors(); fetchDepartments() }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try { const r = await fetch('/api/doctors'); if (r.ok) { const data = await r.json(); setDoctors(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const fetchDepartments = async () => {
    try { const r = await fetch('/api/departments'); if (r.ok) { const data = await r.json(); setDepartments(Array.isArray(data) ? data : []) } }
    catch { toast('Failed to fetch departments', 'error') }
  }

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', email: '', password: '', departmentId: '', specialization: '', qualification: '' })
    setShowForm(true)
  }

  const onSubmit = async (data: DoctorForm) => {
    setSaving(true)
    try {
      const r = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (r.ok) {
        toast('Doctor registered successfully', 'success')
        setShowForm(false)
        fetchDoctors()
      } else {
        const d = await r.json()
        toast(d.error || 'Failed to register doctor', 'error')
      }
    } catch { toast('Error registering doctor', 'error') }
    finally { setSaving(false) }
  }

  const toggleAvailability = async (doc: Doctor) => {
    try {
      const r = await fetch(`/api/doctors/${doc.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !doc.available, specialization: doc.specialization }),
      })
      if (r.ok) { toast(`Dr. ${doc.user.name} is now ${!doc.available ? 'available' : 'unavailable'}`, 'success'); fetchDoctors() }
    } catch { toast('Error updating availability', 'error') }
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
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
    <div className="p-8">
      <div className="mb-6">
        <Link href="/settings"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Button></Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
            <p className="text-gray-600 mt-1">Register doctors and manage their departments</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Register New Doctor</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input {...register('name')} placeholder="Dr. John Doe" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input type="email" {...register('email')} placeholder="doctor@rsnexus.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input type="password" {...register('password')} placeholder="Min 6 characters" />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Department *</label>
                  <select {...register('departmentId')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Specialization *</label>
                  <Input {...register('specialization')} placeholder="e.g. Cardiology, Neurology" />
                  {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Qualification</label>
                  <Input {...register('qualification')} placeholder="e.g. MBBS, MD, DM" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Register Doctor
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
          <Button className="mt-4" size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Register Doctor
          </Button>
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
                    {doc.qualification && <p className="text-xs text-gray-400">{doc.qualification}</p>}
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
    </RoleGuard>
  )
}
