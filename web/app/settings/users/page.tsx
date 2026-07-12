"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Loader2, Edit, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/dialog'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface User { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }
type UserForm = { name: string; email: string; password?: string; role: 'super_admin' | 'hospital_admin' | 'receptionist' | 'doctor' | 'nurse' | 'lab_technician' | 'pharmacist' | 'billing_staff'; isActive?: boolean }

const roles = ['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'billing_staff']
const roleColors: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800', hospital_admin: 'bg-purple-100 text-purple-800',
  receptionist: 'bg-blue-100 text-blue-800', doctor: 'bg-green-100 text-green-800',
  nurse: 'bg-pink-100 text-pink-800', lab_technician: 'bg-cyan-100 text-cyan-800',
  pharmacist: 'bg-orange-100 text-orange-800', billing_staff: 'bg-yellow-100 text-yellow-800',
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { hasRole } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', password: '', role: 'receptionist', isActive: true },
  })

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try { const r = await fetch('/api/users'); if (r.ok) { const data = await r.json(); setUsers(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const openCreate = () => { setEditing(null); reset({ name: '', email: '', password: '', role: 'receptionist', isActive: true }); setShowForm(true) }
  const openEdit = (u: User) => { setEditing(u); reset({ name: u.name, email: u.email, password: '', role: u.role as UserForm['role'], isActive: u.isActive }); setShowForm(true) }

  const onSubmit = async (data: UserForm) => {
    if (!editing && !data.password) { toast('Password required for new user', 'error'); return }
    setSaving(true)
    try {
      const url = editing ? `/api/users/${editing.id}` : '/api/users'
      const method = editing ? 'PUT' : 'POST'
      const body = { ...data, password: data.password || undefined }
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (r.ok) { toast(editing ? 'User updated' : 'User created', 'success'); setShowForm(false); fetchUsers() }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error') }
    } catch (e) { toast('Error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (r.ok) { toast('User deleted', 'success'); setDeleteTarget(null); fetchUsers() }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error') }
    } finally { setDeleting(false) }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin']}>
    <div className="p-8">
      <div className="mb-6">
        <Link href="/settings"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Button></Link>
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-gray-900">User Management</h1><p className="text-gray-600 mt-1">Manage system users and roles</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing ? 'Edit' : 'Add'} User</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Name *</label><Input {...register('name')} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}</div>
                <div><label className="text-sm font-medium">Email *</label><Input type="email" {...register('email')} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}</div>
                <div><label className="text-sm font-medium">{editing ? 'New Password (blank = keep)' : 'Password *'}</label><Input type="password" {...register('password')} placeholder={editing ? '••••••••' : ''} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}</div>
                <div><label className="text-sm font-medium">Role *</label><select {...register('role')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>{errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}</div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : users.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3"><Badge className={roleColors[u.role]}>{u.role.replace(/_/g, ' ')}</Badge></td>
                    <td className="p-3"><Badge variant={u.isActive ? 'default' : 'destructive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(u)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-red-500" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete User" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting} />
    </div>
    </RoleGuard>
  )
}
