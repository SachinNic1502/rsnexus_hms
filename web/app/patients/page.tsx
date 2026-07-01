"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, User, Phone, Loader2, Users } from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  uhid: string
  name: string
  mobile: string
  gender: string
  age: number | null
  bloodGroup: string | null
  createdAt: string
  _count: {
    appointments: number
    admissions: number
  }
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'uhid' | 'mobile' | 'name'>('name')

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
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBloodGroupDisplay = (group: string | null) => {
    if (!group) return 'N/A'
    return group.replace('_', '+')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records and registrations</p>
        </div>
        <Link href="/patients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Patient
          </Button>
        </Link>
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

      {/* Patient List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4">
          {patients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No patients found</p>
              <Link href="/patients/new">
                <Button className="mt-4" size="sm">Register Patient</Button>
              </Link>
            </div>
          ) : (
            patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <Badge variant="secondary">{patient.uhid}</Badge>
                        </div>
                        <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {patient.mobile}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {patient.gender}, {patient.age || 'N/A'} years
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
                      <Link href={`/patients/${patient.id}`}>
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
