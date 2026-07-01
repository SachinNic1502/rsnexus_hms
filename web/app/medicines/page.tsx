"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicineSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Loader2, Edit, Trash2, Pill } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useState, useEffect as UseEffect2 } from 'react'

interface Medicine {
  id: string; name: string; genericName: string | null; manufacturer: string | null
  category: string | null; stock: number; unit: string; price: number
}

type MedicineForm = { name: string; genericName?: string; manufacturer?: string; category?: string; stock: number; unit: string; price: number }

export default function MedicinesPage() {
  const { toast } = useToast()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MedicineForm>({
    resolver: zodResolver(medicineSchema),
    defaultValues: { name: '', genericName: '', manufacturer: '', category: '', stock: 0, unit: 'tablet', price: 0 },
  })

  UseEffect2(() => { fetchMedicines() }, [])

  const fetchMedicines = async () => {
    setLoading(true)
    try { const r = await fetch('/api/medicines'); if (r.ok) { const data = await r.json(); setMedicines(Array.isArray(data) ? data : []) } }
    catch { toast('Failed to fetch medicines', 'error') }
    finally { setLoading(false) }
  }

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditing(null); reset({ name: '', genericName: '', manufacturer: '', category: '', stock: 0, unit: 'tablet', price: 0 }); setShowForm(true) }
  const openEdit = (m: Medicine) => { setEditing(m); reset({ name: m.name, genericName: m.genericName || '', manufacturer: m.manufacturer || '', category: m.category || '', stock: m.stock, unit: m.unit, price: m.price }); setShowForm(true) }

  const onSubmit = async (data: MedicineForm) => {
    setSaving(true)
    try {
      const url = editing ? `/api/medicines/${editing.id}` : '/api/medicines'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (r.ok) { toast(editing ? 'Medicine updated' : 'Medicine created', 'success'); setShowForm(false); fetchMedicines() }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error') }
    } catch (e) { toast('Error saving medicine', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/medicines/${deleteTarget.id}`, { method: 'DELETE' })
      if (r.ok) { toast('Medicine deleted', 'success'); setDeleteTarget(null); fetchMedicines() }
      else { const d = await r.json(); toast(d.error || 'Failed', 'error') }
    } catch (e) { toast('Error deleting', 'error') }
    finally { setDeleting(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></Link>
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-gray-900">Medicine Catalog</h1><p className="text-gray-600 mt-1">Manage medicines and stock</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Medicine</Button>
        </div>
      </div>

      <div className="mb-4"><Input placeholder="Search by name, generic, category..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>{editing ? 'Edit' : 'Add'} Medicine</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Name *</label><Input {...register('name')} placeholder="Medicine name" />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}</div>
                <div><label className="text-sm font-medium">Generic Name</label><Input {...register('genericName')} placeholder="e.g. Paracetamol" /></div>
                <div><label className="text-sm font-medium">Category</label><Input {...register('category')} placeholder="e.g. Analgesic" /></div>
                <div><label className="text-sm font-medium">Manufacturer</label><Input {...register('manufacturer')} placeholder="Manufacturer" /></div>
                <div><label className="text-sm font-medium">Unit *</label><select {...register('unit')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option><option value="injection">Injection</option><option value="cream">Cream</option><option value="drops">Drops</option><option value="inhaler">Inhaler</option><option value="sachet">Sachet</option>
                </select>{errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}</div>
                <div><label className="text-sm font-medium">Stock</label><Input type="number" {...register('stock', { valueAsNumber: true })} min="0" /></div>
                <div><label className="text-sm font-medium">Price (₹) *</label><Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} placeholder="0.00" />{errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}</div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {editing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No medicines found</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left p-3">Name</th><th className="text-left p-3">Generic</th><th className="text-left p-3">Category</th><th className="text-left p-3">Manufacturer</th><th className="text-right p-3">Stock</th><th className="text-right p-3">Price</th><th className="text-right p-3">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3">{m.genericName || '-'}</td>
                    <td className="p-3"><Badge variant="outline">{m.category || '-'}</Badge></td>
                    <td className="p-3">{m.manufacturer || '-'}</td>
                    <td className="p-3 text-right"><Badge variant={m.stock < 10 ? 'destructive' : 'default'}>{m.stock}</Badge></td>
                    <td className="p-3 text-right">₹{m.price}</td>
                    <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(m)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(m)}><Trash2 className="h-4 w-4 text-red-500" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Medicine" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting} />
    </div>
  )
}
