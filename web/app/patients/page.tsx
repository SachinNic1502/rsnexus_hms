"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, User, Phone, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Patient {
  id: string
  uhid: string
  name: string
  mobile: string
  gender: string
  age: number | null
  bloodGroup: string | null
  createdAt: string
  appointments?: { status: string; date: string }[]
  admissions?: { id: string }[]
  _count: {
    appointments: number
    admissions: number
  }
}

type WorkflowStatusKey = 'admitted' | 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'registered'
type WorkflowBadge = { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }

// Derive the patient's current workflow status key from their active
// admission (IPD) or their most recent appointment status (OPD lifecycle).
// This is the single source of truth used both for the status badge and for
// the filter tabs below, so the two always agree.
function getWorkflowStatusKey(patient: Patient): WorkflowStatusKey {
  if (patient.admissions && patient.admissions.length > 0) {
    return 'admitted'
  }
  const latest = patient.appointments && patient.appointments.length > 0 ? patient.appointments[0] : null
  if (!latest) {
    return 'registered'
  }
  switch (latest.status) {
    case 'scheduled':
    case 'waiting':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return latest.status
    default:
      return 'registered'
  }
}

// Mirrors the AppointmentStatus wording used across the app: In Queue = waiting.
const WORKFLOW_STATUS_LABELS: Record<WorkflowStatusKey, WorkflowBadge> = {
  admitted: { label: 'Admitted (IPD)', variant: 'default' },
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  waiting: { label: 'In Queue', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  registered: { label: 'Registered', variant: 'outline' },
}

function getWorkflowStatus(patient: Patient): WorkflowBadge {
  return WORKFLOW_STATUS_LABELS[getWorkflowStatusKey(patient)]
}

// Status filter tabs shown on the Patients page.
const STATUS_TABS: { key: WorkflowStatusKey | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'waiting', label: 'In Queue' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'admitted', label: 'Admitted' },
  { key: 'completed', label: 'Completed' },
]

export default function PatientsPage() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'uhid' | 'mobile' | 'name'>('name')
  const [statusFilter, setStatusFilter] = useState<WorkflowStatusKey | 'all'>('all')

  useEffect(() => {
    fetchPatients()
  }, [searchQuery, searchType])

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.set('search', searchQuery)
        params.set('searchType', searchType)
      }
      const res = await fetch(`/api/patients?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPatients(Array.isArray(data) ? data : [])
      }
    } catch {
      toast('Failed to fetch patients', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getBloodGroupDisplay = (group: string | null) => {
    if (!group) return 'N/A'
    // e.g. "A_positive" -> "A+", "O_negative" -> "O-". A plain replace('_','+')
    // wrongly produced "A+positive"; map the suffix explicitly.
    return group.replace('_positive', '+').replace('_negative', '-')
  }

  // Client-side status filter — applied on top of the existing search
  // results, so search + status filter can be combined freely.
  const filteredPatients = statusFilter === 'all'
    ? patients
    : patients.filter((p) => getWorkflowStatusKey(p) === statusFilter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records and registrations</p>
        </div>
        {/* <Link href="/patients/register">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Patient
          </Button>
        </Link> */}
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search by ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={searchType === 'uhid' ? 'default' : 'outline'}
                onClick={() => setSearchType('uhid')}
              >
                UHID
              </Button>
              <Button
                variant={searchType === 'mobile' ? 'default' : 'outline'}
                onClick={() => setSearchType('mobile')}
              >
                Mobile
              </Button>
              <Button
                variant={searchType === 'name' ? 'default' : 'outline'}
                onClick={() => setSearchType('name')}
              >
                Name
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={statusFilter === tab.key ? 'default' : 'outline'}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No patients found</p>
              <Link href="/patients/register">
                <Button className="mt-4" size="sm">Register Patient</Button>
              </Link>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <Badge variant="secondary">{patient.uhid}</Badge>
                          {(() => {
                            const wf = getWorkflowStatus(patient)
                            return <Badge variant={wf.variant}>{wf.label}</Badge>
                          })()}
                        </div>
                        <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {patient.mobile}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {patient.gender}, {patient.age ?? 'N/A'} years
                          </div>
                          <div>
                            Blood Group: {getBloodGroupDisplay(patient.bloodGroup)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {patient._count.appointments} visits
                      </p>
                      <Link href={patient.admissions?.[0]?.id ? `/ipd/${patient.admissions[0].id}` : `/patients/${patient.id}`}>
                        <Button variant="outline" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
