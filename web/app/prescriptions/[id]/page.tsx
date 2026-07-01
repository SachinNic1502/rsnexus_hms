"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, Loader2, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Prescription {
  id: string
  createdAt: string
  patient: { name: string; uhid: string; age: number | null; gender: string; mobile: string; address: string }
  doctor: { user: { name: string }; specialization: string; qualification: string }
  medicines: { medicineName: string; dose: string; frequency: string; duration: string; instructions: string }[]
  consultation?: { chiefComplaint: string; diagnosis: string; symptoms: string; clinicalNotes: string }
}

export default function PrescriptionPrintPage() {
  const params = useParams()
  const { toast } = useToast()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPrescription() }, [params.id])

  const fetchPrescription = async () => {
    try {
      const res = await fetch(`/api/prescriptions/${params.id}`)
      if (!res.ok) throw new Error('Prescription not found')
      setPrescription(await res.json())
    } catch { toast('Failed to fetch prescription', 'error') }
    finally { setLoading(false) }
  }

  const handlePrint = () => { window.print() }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!prescription) return <div className="p-8 text-center text-red-500">Prescription not found</div>

  return (
    <div className="p-8">
      {/* Controls - hidden on print */}
      <div className="mb-6 no-print">
        <Link href={`/patients/${prescription.patient?.uhid || ''}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prescription Preview</h1>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Prescription
          </Button>
        </div>
      </div>

      {/* Printable Prescription */}
      <Card className="max-w-3xl mx-auto print:shadow-none print:border-2 print:border-black">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Rs Nexus Hospital</h1>
            </div>
            <p className="text-sm text-gray-600">123 Healthcare Avenue, Medical District</p>
            <p className="text-sm text-gray-600">Phone: +91 98765 43210 | Email: info@rsnexus.com</p>
          </div>

          {/* Prescription Info */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-gray-600">Date: <span className="font-medium">{new Date(prescription.createdAt).toLocaleDateString('en-IN')}</span></p>
              <p className="text-sm text-gray-600">Prescription #: <span className="font-medium">{prescription.id.slice(0, 8).toUpperCase()}</span></p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Patient Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><span className="text-gray-600">Name:</span> {prescription.patient.name}</p>
              <p><span className="text-gray-600">UHID:</span> {prescription.patient.uhid}</p>
              <p><span className="text-gray-600">Age:</span> {prescription.patient.age || 'N/A'} years</p>
              <p><span className="text-gray-600">Gender:</span> {prescription.patient.gender}</p>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">Prescribed by:</p>
            <p className="font-semibold text-lg">Dr. {prescription.doctor.user.name}</p>
            <p className="text-sm text-gray-600">{prescription.doctor.specialization} | {prescription.doctor.qualification}</p>
          </div>

          {/* Diagnosis */}
          {prescription.consultation && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 border-b pb-1">Diagnosis</h3>
              <p className="text-sm"><span className="text-gray-600">Chief Complaint:</span> {prescription.consultation.chiefComplaint}</p>
              <p className="text-sm"><span className="text-gray-600">Diagnosis:</span> {prescription.consultation.diagnosis}</p>
              {prescription.consultation.clinicalNotes && (
                <p className="text-sm mt-1"><span className="text-gray-600">Notes:</span> {prescription.consultation.clinicalNotes}</p>
              )}
            </div>
          )}

          {/* Medicines */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 border-b pb-1">Medications</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Medicine</th>
                  <th className="text-left p-2">Dose</th>
                  <th className="text-left p-2">Frequency</th>
                  <th className="text-left p-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {prescription.medicines.map((m, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-medium">{m.medicineName}</td>
                    <td className="p-2">{m.dose}</td>
                    <td className="p-2">{m.frequency}</td>
                    <td className="p-2">{m.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Instructions */}
            {prescription.medicines.some(m => m.instructions) && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Special Instructions:</h4>
                {prescription.medicines.filter(m => m.instructions).map((m, i) => (
                  <p key={i} className="text-sm text-gray-600">• {m.medicineName}: {m.instructions}</p>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-black pt-4 mt-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Doctor's Signature</p>
                <div className="w-48 border-b border-gray-400 mt-6" />
                <p className="text-sm font-medium mt-1">Dr. {prescription.doctor.user.name}</p>
                <p className="text-xs text-gray-500">{prescription.doctor.specialization}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">This is a computer-generated prescription.</p>
                <p className="text-xs text-gray-500">Valid for 30 days from date of issue.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
