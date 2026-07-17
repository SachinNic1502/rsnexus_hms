"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { serviceSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Loader2, Edit, Trash2, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/dialog'

interface Service { id: string; name: string; category: string; price: number; description: string | null; isActive: boolean }
type ServiceForm = { name: string; category: string; price: number; description?: string }

export default function ServicesPage() {
  const { toast } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', category: '', price: 0, description: '' },
  })

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    setLoading(true)
    try { const r = await fetch('/api/services?includeInactive=true'); if (r.ok) { const data = await r.json(); setServices(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); reset({ name: '', category: '', price: 0, description: '' }); setShowForm(true) }
  const openEdit = (s: Service) => { setEditing(s); reset({ name: s.name, category: s.category, price: s.price, description: s.description || '' }); setShowForm(true) }

  const onSubmit = async (data: ServiceForm) => {
    setSaving(true)
    try {
      const url = editing ? `/api/services/${editing.id}` : '/api/services'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (r.ok) { toast(editing ? 'Service updated' : 'Service created', 'success'); setShowForm(false); fetchServices() }
      else { toast('Failed to save', 'error') }
    } catch (e) { toast('Error saving service', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/services/${deleteTarget.id}`, { method: 'DELETE' })
      if (r.ok) { toast('Service deleted', 'success'); setDeleteTarget(null); fetchServices() }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error') }
    } catch (e) { toast('Error deleting', 'error') }
    finally { setDeleting(false) }
  }

  const categories = [...new Set(services.map(s => s.category))]

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1><p className="text-gray-600 mt-1">Manage hospital services and pricing</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
        </div>
      </div>

      <div className="mb-4"><Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing ? 'Edit' : 'Add'} Service</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Service Name *</label><Input {...register('name')} placeholder="e.g. X-Ray" />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}</div>
                <div><label className="text-sm font-medium">Category *</label><Input {...register('category')} placeholder="e.g. Radiology" list="categories" /><datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>{errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}</div>
                <div><label className="text-sm font-medium">Price (₹) *</label><Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} placeholder="0.00" />{errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}</div>
                <div><label className="text-sm font-medium">Description</label><Input {...register('description')} placeholder="Optional description" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-blue-500" /><h3 className="font-semibold">{s.name}</h3></div>
                  <Badge variant="outline">{s.category}</Badge>
                </div>
                {s.description && <p className="text-sm text-gray-600 mb-3">{s.description}</p>}
                <p className="text-lg font-bold text-green-600 mb-3">₹{s.price.toLocaleString()}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <Stethoscope className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No services found</p>
              <Button className="mt-4" size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Service" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting} />
    </div>
  )
}
