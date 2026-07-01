"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PatientEditPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    gender: 'male',
    dateOfBirth: '',
    age: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    emergencyContactNumber: '',
  })

  useEffect(() => { fetchPatient() }, [params.id])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${params.id}`)
      if (!res.ok) throw new Error('Patient not found')
      const p = await res.json()
      setFormData({
        name: p.name || '',
        mobile: p.mobile || '',
        gender: p.gender || 'male',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
        age: p.age?.toString() || '',
        address: p.address || '',
        bloodGroup: p.bloodGroup || '',
        emergencyContact: p.emergencyContact || '',
        emergencyContactNumber: p.emergencyContactNumber || '',
      })
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/patients/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update patient')
      }
      router.push(`/patients/${params.id}`)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/patients/${params.id}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patient
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile *</label>
                <Input name="mobile" value={formData.mobile} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Age</label>
                <Input type="number" name="age" value={formData.age} onChange={handleChange} min="0" max="150" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option value="A_positive">A+</option>
                  <option value="A_negative">A-</option>
                  <option value="B_positive">B+</option>
                  <option value="B_negative">B-</option>
                  <option value="AB_positive">AB+</option>
                  <option value="AB_negative">AB-</option>
                  <option value="O_positive">O+</option>
                  <option value="O_negative">O-</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address *</label>
              <Input name="address" value={formData.address} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Emergency Contact</label>
                <Input name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Emergency Contact Number</label>
                <Input name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href={`/patients/${params.id}`}><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
