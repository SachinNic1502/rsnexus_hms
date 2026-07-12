"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { departmentSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Loader2, Edit, Building } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface Department { id: string; name: string; description: string | null; _count: { doctors: number } }
type DeptForm = { name: string; description?: string }

export default function DepartmentsPage() {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeptForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => { fetchDepartments() }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try { const r = await fetch('/api/departments'); if (r.ok) { const data = await r.json(); setDepartments(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); reset({ name: '', description: '' }); setShowForm(true) }
  const openEdit = (d: Department) => { setEditing(d); reset({ name: d.name, description: d.description || '' }); setShowForm(true) }

  const onSubmit = async (data: DeptForm) => {
    setSaving(true)
    try {
      const url = editing ? `/api/departments/${editing.id}` : '/api/departments'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (r.ok) { toast(editing ? 'Updated' : 'Created', 'success'); setShowForm(false); fetchDepartments() }
      else { toast('Failed', 'error') }
    } finally { setSaving(false) }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
    <div className="p-8">
      <div className="mb-6">
        <Link href="/settings"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Button></Link>
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-gray-900">Department Management</h1><p className="text-gray-600 mt-1">Manage hospital departments</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing ? 'Edit' : 'Add'} Department</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><label className="text-sm font-medium">Name *</label><Input {...register('name')} placeholder="e.g. Cardiology" />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}</div>
              <div><label className="text-sm font-medium">Description</label><Input {...register('description')} placeholder="Optional description" /></div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : departments.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {departments.map(d => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{d.name}</h3>
                  <Badge variant="secondary">{d._count.doctors} doctors</Badge>
                </div>
                {d.description && <p className="text-sm text-gray-600 mb-3">{d.description}</p>}
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
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
