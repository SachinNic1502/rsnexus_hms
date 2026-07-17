"use client"

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { nurseCreateSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, CheckCircle, XCircle, HeartPulse, Plus } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Nurse {
  id: string; name: string; email: string; staffType: string; isActive: boolean
}

type NurseForm = {
  name: string; email: string; password: string; staffType: 'Nurse' | 'Compounder'
}

export default function NursesPage() {
  const { toast } = useToast()
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NurseForm>({
    resolver: zodResolver(nurseCreateSchema) as unknown as Resolver<NurseForm>,
    defaultValues: { name: '', email: '', password: '', staffType: 'Nurse' },
  })

  useEffect(() => { fetchNurses() }, [])

  const fetchNurses = async () => {
    setLoading(true)
    try { const r = await fetch('/api/nurses'); if (r.ok) { const data = await r.json(); setNurses(Array.isArray(data) ? data : []) } }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    reset({ name: '', email: '', password: '', staffType: 'Nurse' })
    setShowForm(true)
  }

  const onSubmit = async (data: NurseForm) => {
    setSaving(true)
    try {
      const r = await fetch('/api/nurses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (r.ok) {
        toast(`${data.staffType} registered successfully`, 'success')
        setShowForm(false)
        fetchNurses()
      } else {
        const d = await r.json()
        toast(d.error || 'Failed to register', 'error')
      }
    } catch { toast('Error registering', 'error') }
    finally { setSaving(false) }
  }

  const toggleActive = async (nurse: Nurse) => {
    try {
      const r = await fetch(`/api/nurses/${nurse.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !nurse.isActive, staffType: nurse.staffType }),
      })
      if (r.ok) { toast(`${nurse.name} is now ${!nurse.isActive ? 'active' : 'inactive'}`, 'success'); fetchNurses() }
    } catch { toast('Error updating status', 'error') }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/settings"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Button></Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nurse / Compounder Management</h1>
            <p className="text-gray-600 mt-1">Register nurses and compounders</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Nurse</Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Register New Nurse / Compounder</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input {...register('name')} placeholder="Jane Doe" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input type="email" {...register('email')} placeholder="nurse@jeevantihospitals.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <Input type="password" {...register('password')} placeholder="Min 6 characters" />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Staff Type *</label>
                  <select {...register('staffType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="Nurse">Nurse</option>
                    <option value="Compounder">Compounder</option>
                  </select>
                  {errors.staffType && <p className="text-xs text-red-500 mt-1">{errors.staffType.message}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Register
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div> : nurses.length === 0 ? (
        <div className="text-center py-12">
          <HeartPulse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No nurses or compounders found</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Register Nurse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {nurses.map(nurse => (
            <Card key={nurse.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{nurse.name}</h3>
                    <p className="text-sm text-gray-500">{nurse.staffType}</p>
                    <p className="text-xs text-gray-400">{nurse.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nurse.isActive ? 'default' : 'destructive'}>
                      {nurse.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(nurse)}>
                      {nurse.isActive ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
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
