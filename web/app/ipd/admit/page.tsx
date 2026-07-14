"use client"

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

function IPDAdmitForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [beds, setBeds] = useState<any[]>([])

  // Optional link back to the originating OPD appointment/consultation when
  // this admission is started from the "Admit Patient" step of Finish
  // Consultation. Lets discharge later complete that consultation.
  const [linkIds] = useState(() => ({
    appointmentId: searchParams.get('appointmentId') || '',
    consultationId: searchParams.get('consultationId') || '',
  }))
  const fromConsultation = Boolean(linkIds.appointmentId || linkIds.consultationId)

  const [formData, setFormData] = useState({
    doctorId: searchParams.get('doctorId') || '',
    wardId: '',
    roomId: '',
    bedId: '',
    // Pre-filled when the doctor already entered it on the Finish
    // Consultation modal's Admit Patient step; still editable here.
    expectedStayDays: searchParams.get('expectedStayDays') || '',
  })

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepartments(Array.isArray(d) ? d : []))
    fetch('/api/wards').then(r => r.json()).then(d => setWards(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    fetch('/api/doctors').then(r => r.json()).then(d => setDoctors(Array.isArray(d) ? d : []))
  }, [])

  // Prefill the patient when admitting straight from a consultation.
  useEffect(() => {
    const patientId = searchParams.get('patientId')
    if (!patientId) return
    fetch(`/api/patients/${patientId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(p => {
        if (p && p.id) {
          setSelectedPatient(p)
          setPatientSearch(p.uhid)
        }
      })
      .catch(() => { /* fall back to manual search */ })
  }, [searchParams])

  useEffect(() => {
    if (formData.wardId) {
      const ward = wards.find((w: any) => w.id === formData.wardId)
      if (ward) setRooms(ward.rooms || [])
      setFormData(prev => ({ ...prev, roomId: '', bedId: '' }))
    }
  }, [formData.wardId, wards])

  useEffect(() => {
    if (formData.roomId) {
      const room = rooms.find((r: any) => r.id === formData.roomId)
      if (room) {
        const availableBeds = (room.beds || []).filter((b: any) => b.status === 'available')
        setBeds(availableBeds)
      }
      setFormData(prev => ({ ...prev, bedId: '' }))
    }
  }, [formData.roomId, rooms])

  useEffect(() => {
    if (patientSearch.length >= 2) {
      fetch(`/api/patients?search=${patientSearch}&searchType=uhid`).then(r => r.json()).then(d => setPatientResults(Array.isArray(d) ? d : []))
    } else {
      setPatientResults([])
    }
  }, [patientSearch])

  const selectPatient = (p: any) => {
    setSelectedPatient(p)
    setPatientSearch(p.uhid)
    setPatientResults([])
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) { setError('Please select a patient'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: formData.doctorId,
          wardId: formData.wardId,
          roomId: formData.roomId,
          bedId: formData.bedId,
          expectedStayDays: formData.expectedStayDays,
          appointmentId: linkIds.appointmentId,
          consultationId: linkIds.consultationId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to admit patient')
      }
      const admission = await res.json()
      toast(`Patient admitted! Admission #: ${admission.admissionNumber}`, 'success')
      router.push('/ipd')
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/ipd"><Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to IPD</Button></Link>
        <h1 className="text-3xl font-bold text-gray-900">New IPD Admission</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader><CardTitle>Admission Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div>
              <h3 className="text-lg font-semibold mb-4">Patient</h3>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Search by UHID *</label>
                <Input value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }} placeholder="Type UHID..." required />
                {patientResults.length > 0 && !selectedPatient && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                    {patientResults.map((p: any) => (
                      <div key={p.id} className="p-3 hover:bg-gray-100 cursor-pointer" onClick={() => selectPatient(p)}>
                        <p className="font-medium">{p.name} <span className="text-sm text-gray-500">({p.uhid})</span></p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatient && <p className="text-sm text-green-600">Selected: {selectedPatient.name}</p>}
              </div>
            </div>

            {fromConsultation && (
              <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 p-3 rounded-md">
                Admitting from consultation — the patient and doctor have been pre-filled. The originating consultation will be completed automatically when this patient is discharged.
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Doctor &amp; Stay</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attending Doctor *</label>
                  <select name="doctorId" value={formData.doctorId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select Doctor</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.user.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Admission Duration (days)</label>
                  <Input
                    type="number"
                    min={1}
                    name="expectedStayDays"
                    value={formData.expectedStayDays}
                    onChange={e => setFormData({ ...formData, expectedStayDays: e.target.value })}
                    placeholder="e.g. 3"
                  />
                  <p className="text-xs text-gray-500">Estimate only — the patient stays admitted until the doctor discharges them.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Bed Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ward *</label>
                  <select name="wardId" value={formData.wardId} onChange={handleChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select Ward</option>
                    {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.availableBeds} beds available)</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room *</label>
                  <select name="roomId" value={formData.roomId} onChange={handleChange} required disabled={!formData.wardId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                    <option value="">Select Room</option>
                    {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.roomNumber} ({r.type})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bed *</label>
                  <select name="bedId" value={formData.bedId} onChange={handleChange} required disabled={!formData.roomId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                    <option value="">Select Bed</option>
                    {beds.map((b: any) => <option key={b.id} value={b.id}>Bed {b.bedNumber}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/ipd"><Button type="button" variant="outline">Cancel</Button></Link>
              <Button type="submit" disabled={loading || !selectedPatient}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Admit Patient
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function IPDAdmitPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
      <IPDAdmitForm />
    </Suspense>
  )
}
