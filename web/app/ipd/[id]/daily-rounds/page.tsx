"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dailyRoundSchema } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2, Activity, Thermometer, Heart, Droplets } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

type DailyRoundForm = { temperature?: string; bloodPressure?: string; pulse?: string; respiratoryRate?: string; oxygenSaturation?: string; notes: string }

export default function DailyRoundsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { hasRole } = useAuth()
  const [admission, setAdmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<DailyRoundForm>({
    resolver: zodResolver(dailyRoundSchema.omit({ admissionId: true, doctorId: true })),
    defaultValues: { temperature: '', bloodPressure: '', pulse: '', respiratoryRate: '', oxygenSaturation: '', notes: '' },
  })

  useEffect(() => { fetchAdmission() }, [params.id])

  const fetchAdmission = async () => {
    try { const r = await fetch(`/api/admissions/${params.id}`); if (r.ok) setAdmission(await r.json()) }
    finally { setLoading(false) }
  }

  const onSubmit = async (data: DailyRoundForm) => {
    setSaving(true)
    try {
      const r = await fetch('/api/daily-rounds', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionId: params.id, doctorId: admission.doctor.id, ...data }),
      })
      if (r.ok) { toast('Daily round recorded!', 'success'); router.push(`/ipd/${params.id}`) }
      else { toast('Failed to save', 'error') }
    } catch (e) { toast('Error', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'nurse']}><div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div></RoleGuard>
  if (!admission) return <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'nurse']}><div className="p-8 text-center text-red-500">Admission not found</div></RoleGuard>

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'nurse']}>
      <div className="p-8">
        <div className="mb-6">
          <Link href={`/ipd/${params.id}`}><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Admission</Button></Link>
          <h1 className="text-3xl font-bold text-gray-900">Record Daily Round</h1>
          <p className="text-gray-600 mt-1">{admission.patient.name} | {admission.ward.name} - Room {admission.room.roomNumber}, Bed {admission.bed.bedNumber}</p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Patient Vitals & Notes</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature (°F)</label><Input type="number" step="0.1" {...register('temperature')} placeholder="98.6" /></div>
                <div><label className="text-sm font-medium flex items-center gap-1"><Droplets className="h-3 w-3" /> Blood Pressure</label><Input {...register('bloodPressure')} placeholder="120/80" /></div>
                <div><label className="text-sm font-medium flex items-center gap-1"><Heart className="h-3 w-3" /> Pulse (bpm)</label><Input type="number" {...register('pulse')} placeholder="72" /></div>
                <div><label className="text-sm font-medium">Resp Rate</label><Input type="number" {...register('respiratoryRate')} placeholder="16" /></div>
                <div><label className="text-sm font-medium">SpO2 (%)</label><Input type="number" {...register('oxygenSaturation')} placeholder="98" /></div>
              </div>
              <div><label className="text-sm font-medium">Clinical Notes *</label><textarea {...register('notes')} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Enter observations, treatment plan, medication changes..." />{errors.notes && <p className="text-xs text-red-500 mt-1">{errors.notes.message}</p>}</div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href={`/ipd/${params.id}`}><Button type="button" variant="outline">Cancel</Button></Link>
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Round</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
