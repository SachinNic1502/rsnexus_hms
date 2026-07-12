"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, Loader2, Building2, Download } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { jsPDF } from 'jspdf'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'
import autoTable from 'jspdf-autotable'

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
  const { hasRole } = useAuth()
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

  const handleDownloadPDF = () => {
    if (!prescription) return
    const doc = new jsPDF()

    // Title / Clinic Header
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Rs Nexus Hospital", 14, 20)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text("123 Healthcare Boulevard, Tech City", 14, 25)
    doc.text("Phone: +91 98765 43210 | Support: contact@rsnexus.com", 14, 29)

    // Doctor Details (Right Side)
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(10)
    doc.text(`Dr. ${prescription.doctor.user.name}`, 140, 20)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`${prescription.doctor.qualification}`, 140, 25)
    doc.text(`${prescription.doctor.specialization}`, 140, 29)

    doc.setDrawColor(200, 200, 200)
    doc.line(14, 33, 196, 33)

    // Patient Details Bar
    doc.setFillColor(245, 247, 250)
    doc.rect(14, 38, 182, 22, "F")
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(9)
    doc.text(`Patient Name: ${prescription.patient.name}`, 18, 44)
    doc.text(`UHID: ${prescription.patient.uhid}`, 18, 50)
    doc.text(`Age/Gender: ${prescription.patient.age || 'N/A'} / ${prescription.patient.gender}`, 110, 44)
    doc.text(`Mobile: ${prescription.patient.mobile}`, 110, 50)
    doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 110, 55)

    let currentY = 68

    // Clinical info (Chief complaint, diagnosis, etc)
    if (prescription.consultation) {
      doc.setFont("Helvetica", "bold")
      doc.text("CLINICAL DIAGNOSIS", 14, currentY)
      doc.setFont("Helvetica", "normal")
      doc.text(`Chief Complaint: ${prescription.consultation.chiefComplaint || 'N/A'}`, 14, currentY + 6)
      doc.text(`Diagnosis: ${prescription.consultation.diagnosis || 'N/A'}`, 14, currentY + 11)
      currentY += 20
    }

    // Rx sign
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(14)
    doc.text("Rx (Prescribed Medicines)", 14, currentY)

    const tableData = prescription.medicines.map((m: any, idx: number) => [
      idx + 1,
      m.medicineName,
      m.dose,
      m.frequency,
      m.duration,
      m.instructions
    ])

    autoTable(doc, {
      startY: currentY + 4,
      head: [["S.No", "Medicine Name", "Dosage", "Frequency", "Duration", "Instructions"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] }
    })

    let finalY = (doc as any).lastAutoTable.finalY + 15
    doc.line(140, finalY, 190, finalY)
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Authorized Signature", 145, finalY + 5)

    doc.save(`Prescription_${prescription.patient.uhid}.pdf`)
  }

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!prescription) return <div className="p-8 text-center text-red-500">Prescription not found</div>

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'pharmacist', 'nurse']}>
    <div className="p-8">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-prescription, .printable-prescription * {
            visibility: visible;
          }
          .printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print, header, nav, aside, footer {
            display: none !important;
          }
        }
      `}</style>
      {/* Controls - hidden on print */}
      <div className="mb-6 no-print">
        <Link href={`/patients/${prescription.patient?.uhid || ''}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prescription Preview</h1>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadPDF} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Prescription */}
      <Card className="printable-prescription max-w-3xl mx-auto print:shadow-none print:border-2 print:border-black">
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
    </RoleGuard>
  )
}
