"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { labTestSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, TestTube } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

type LabTestForm = { name: string; category: string; price: number; description?: string }

export default function LabCatalogPage() {
  const { toast } = useToast()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LabTestForm>({
    resolver: zodResolver(labTestSchema),
    defaultValues: { name: '', category: '', price: 0, description: '' },
  })

  useEffect(() => { fetchTests() }, [])

  const fetchTests = async () => {
    try { const res = await fetch('/api/lab-tests'); if (res.ok) setTests(await res.json()) }
    finally { setLoading(false) }
  }

  const onSubmit = async (data: LabTestForm) => {
    setSaving(true)
    try {
      const res = await fetch('/api/lab-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast('Test added', 'success'); reset(); setShowForm(false); fetchTests() }
      else { toast('Failed to add test', 'error') }
    } catch (e) { toast('Error', 'error') }
    finally { setSaving(false) }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'lab_technician']}>
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold text-gray-900">Lab Test Catalog</h1><p className="text-gray-600 mt-1">Manage available lab tests</p></div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="mr-2 h-4 w-4" /> Add Test</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Lab Test</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input {...register('name')} placeholder="Test name" />{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-medium">Category *</label><Input {...register('category')} placeholder="e.g. Hematology" />{errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-medium">Price (₹) *</label><Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} />{errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}</div>
                <div className="space-y-2"><label className="text-sm font-medium">Description</label><Input {...register('description')} placeholder="Optional description" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12">
          <TestTube className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No lab tests configured</p>
          <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Test
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test: any) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{test.name}</h3>
                  <Badge variant="outline">₹{test.price}</Badge>
                </div>
                <p className="text-sm text-gray-600">{test.category}</p>
                {test.description && <p className="text-xs text-gray-500 mt-1">{test.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </RoleGuard>
  )
}
