"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bed, BedDouble, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/lib/auth-context'

interface BedData {
  id: string
  bedNumber: string
  status: string
  room: { roomNumber: string; ward: { name: string; type: string } }
  admission?: { patient: { name: string }; admissionDate: string } | null
}

interface WardStats {
  id: string
  name: string
  type: string
  totalBeds: number
  occupied: number
  available: number
  maintenance: number
  occupancyRate: number
}

export default function BedDashboardPage() {
  const { toast } = useToast()
  const [beds, setBeds] = useState<BedData[]>([])
  const [wardStats, setWardStats] = useState<WardStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [wardFilter, setWardFilter] = useState('all')
  const { hasRole } = useAuth()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bedsRes, wardsRes] = await Promise.all([
        fetch('/api/beds'),
        fetch('/api/wards'),
      ])
      if (bedsRes.ok) { const data = await bedsRes.json(); setBeds(Array.isArray(data) ? data : []) }
      if (wardsRes.ok) {
        const data = await wardsRes.json()
        if (Array.isArray(data)) {
          const mapped = data.map((w: any) => {
            const total = w.totalBeds || 0
            const occupied = w.occupiedBeds || 0
            const available = w.availableBeds || 0
            const maintenance = w.rooms?.flatMap((r: any) => r.beds || []).filter((b: any) => b.status === 'maintenance').length || 0
            const rate = total > 0 ? Math.round((occupied / total) * 100) : 0
            return {
              id: w.id,
              name: w.name,
              type: w.type,
              totalBeds: total,
              occupied,
              available,
              maintenance,
              occupancyRate: rate
            }
          })
          setWardStats(mapped)
        } else {
          setWardStats([])
        }
      }
    } catch { toast('Failed to fetch bed data', 'error') }
    finally { setLoading(false) }
  }

  const totalBeds = wardStats.reduce((s, w) => s + w.totalBeds, 0)
  const totalOccupied = wardStats.reduce((s, w) => s + w.occupied, 0)
  const totalAvailable = wardStats.reduce((s, w) => s + w.available, 0)
  const totalMaintenance = wardStats.reduce((s, w) => s + w.maintenance, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0

  let filteredBeds = beds
  if (filter !== 'all') filteredBeds = filteredBeds.filter((b) => b.status === filter)
  if (wardFilter !== 'all') filteredBeds = filteredBeds.filter((b) => b.room.ward.name === wardFilter)

  const uniqueWards = [...new Set(beds.map((b) => b.room.ward.name))]

  return (
    <RoleGuard allowedRoles={['super_admin', 'hospital_admin', 'doctor', 'nurse']}>
    <div className="p-8">
      <div className="mb-6">
        <Link href="/wards">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wards
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Bed Management Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time bed occupancy across all wards</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalBeds}</p>
                <p className="text-sm text-gray-500">Total Beds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{totalAvailable}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bed className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{totalOccupied}</p>
                <p className="text-sm text-gray-500">Occupied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{totalMaintenance}</p>
                <p className="text-sm text-gray-500">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{occupancyRate}%</p>
                <p className="text-sm text-gray-500">Occupancy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Status:</span>
            {['all', 'available', 'occupied', 'maintenance'].map((s) => (
              <Button
                key={s}
                variant={filter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
            <span className="text-sm font-medium ml-4">Ward:</span>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="all">All Wards</option>
              {uniqueWards.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ward Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {wardStats.map((ward) => (
          <Card key={ward.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{ward.name}</h3>
                <Badge variant="outline">{ward.type}</Badge>
              </div>
              <div className="flex items-center gap-6 mb-2">
                <span className="text-sm"><span className="font-bold">{ward.totalBeds}</span> total</span>
                <span className="text-sm text-green-600"><span className="font-bold">{ward.available}</span> available</span>
                <span className="text-sm text-red-600"><span className="font-bold">{ward.occupied}</span> occupied</span>
                {ward.maintenance > 0 && (
                  <span className="text-sm text-yellow-600"><span className="font-bold">{ward.maintenance}</span> maintenance</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    ward.occupancyRate > 80 ? 'bg-red-500' : ward.occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${ward.occupancyRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{ward.occupancyRate}% occupancy</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bed Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Beds ({filteredBeds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredBeds.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No beds found</p>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-2">
              {filteredBeds.map((bed) => (
                <div
                  key={bed.id}
                  className={`p-3 rounded border text-center cursor-default ${
                    bed.status === 'available'
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : bed.status === 'occupied'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <p className="font-bold text-sm">{bed.bedNumber}</p>
                  <p className="text-xs text-gray-500">{bed.room.ward.name}</p>
                  <p className="text-xs text-gray-400">R{bed.room.roomNumber}</p>
                  <Badge
                    variant={bed.status === 'available' ? 'default' : bed.status === 'occupied' ? 'destructive' : 'secondary'}
                    className="text-[10px] mt-1"
                  >
                    {bed.status}
                  </Badge>
                  {bed.admission && (
                    <p className="text-[10px] mt-1 text-gray-600 truncate" title={bed.admission.patient.name}>
                      {bed.admission.patient.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  )
}
